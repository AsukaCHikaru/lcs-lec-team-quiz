var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* src/components/Title.svelte generated by Svelte v3.38.3 */

    function add_css$6() {
    	var style = element("style");
    	style.id = "svelte-15iorsa-style";
    	style.textContent = ".title-wrapper.svelte-15iorsa{text-align:center;margin-bottom:5em}";
    	append(document.head, style);
    }

    function create_fragment$6(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<h1 class="title">LCS LEC TEAM QUIZ</h1>`;
    			attr(div, "class", "title-wrapper svelte-15iorsa");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class Title extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-15iorsa-style")) add_css$6();
    		init(this, options, null, create_fragment$6, safe_not_equal, {});
    	}
    }

    const players = {
      TOP: {
        Dyrus: {
          ign: 'Dyrus',
          position: 'TOP',
          nationality: 'US',
        },
        Hauntzer: {
          ign: 'Hauntzer',
          position: 'TOP',
          nationality: 'US',
        },
        BrokenBlade: {
          ign: 'BrokenBlade',
          position: 'TOP',
          nationality: 'DE',
        },
        Impact: {
          ign: 'Impact',
          position: 'TOP',
          nationality: 'KR',
        },
        Licorice: {
          ign: 'Licorice',
          position: 'TOP',
          nationality: 'CA',
        },
        Fudge: {
          ign: 'Fudge',
          position: 'TOP',
          nationality: 'AU',
        },
        Alphari: {
          ign: 'Alphari',
          position: 'TOP',
          nationality: 'GB',
        },
        sOAZ: {
          ign: 'sOAZ',
          position: 'TOP',
          nationality: 'FR',
        },
        Huni: {
          ign: 'Huni',
          position: 'TOP',
          nationality: 'KR',
        },
        Bwipo: {
          ign: 'Bwipo',
          position: 'TOP',
          nationality: 'BE',
        },
        Kikis: {
          ign: 'Kikis',
          position: 'TOP',
          nationality: 'PL',
        },
        Wunder: {
          ign: 'Wunder',
          position: 'TOP',
          nationality: 'DK',
        },
      },
      JG: {
        TheOddOne: {
          ign: 'TheOddOne',
          position: 'JG',
          nationality: 'CA',
        },
        Amazing: {
          ign: 'Amazing',
          position: 'JG',
          nationality: 'DE',
        },
        Svenskeren: {
          ign: 'Svenskeren',
          position: 'JG',
          nationality: 'DK',
        },
        Grig: {
          ign: 'Grig',
          position: 'JG',
          nationality: 'US',
        },
        Spica: {
          ign: 'Spica',
          position: 'JG',
          nationality: 'CN',
        },
        Xmithie: {
          ign: 'Xmithie',
          position: 'JG',
          nationality: 'PH',
        },
        Santorin: {
          ign: 'Santorin',
          position: 'JG',
          nationality: 'DK',
        },
        Blaber: {
          ign: 'Blaber',
          position: 'JG',
          nationality: 'US',
        },
        Cyanide: {
          ign: 'Cyanide',
          position: 'JG',
          nationality: 'FI',
        },
        Reignover: {
          ign: 'Reignover',
          position: 'JG',
          nationality: 'KR',
        },
        Broxah: {
          ign: 'Broxah',
          position: 'JG',
          nationality: 'DK',
        },
        Selfmade: {
          ign: 'Selfmade',
          position: 'JG',
          nationality: 'PL',
        },
        Jankos: {
          ign: 'Jankos',
          position: 'JG',
          nationality: 'PL',
        },
        Trick: {
          ign: 'Trick',
          position: 'JG',
          nationality: 'PL',
        },
      },
      MID: {
        Reginald: {
          ign: 'Reginald',
          position: 'MID',
          nationality: 'US',
        },
        Bjergsen: {
          ign: 'Bjergsen',
          position: 'MID',
          nationality: 'DK',
        },
        PowerOfEvil: {
          ign: 'PowerOfEvil',
          position: 'MID',
          nationality: 'DE',
        },
        Jensen: {
          ign: 'Jensen',
          position: 'MID',
          nationality: 'DK',
        },
        Perkz: {
          ign: 'Perkz',
          position: 'MID',
          nationality: 'HR',
        },
        XPeke: {
          ign: 'XPeke',
          position: 'MID',
          nationality: 'ES',
        },
        Febiven: {
          ign: 'Febiven',
          position: 'MID',
          nationality: 'NL',
        },
        Caps: {
          ign: 'Caps',
          position: 'MID',
          nationality: 'DK',
        },
        Nemesis: {
          ign: 'Nemesis',
          position: 'MID',
          nationality: 'SI',
        },
      },
      BOT: {
        Chaox: {
          ign: 'Chaox',
          position: 'BOT',
          nationality: 'CN',
        },
        WildTurtle: {
          ign: 'WildTurtle',
          position: 'BOT',
          nationality: 'CA',
        },
        Doublelift: {
          ign: 'Doublelift',
          position: 'BOT',
          nationality: 'US',
        },
        Zven: {
          ign: 'Zven',
          position: 'BOT',
          nationality: 'DK',
        },
        Lost: {
          ign: 'Lost',
          position: 'BOT',
          nationality: 'NZ',
        },
        Tactical: {
          ign: 'Tactical',
          position: 'BOT',
          nationality: 'US',
        },
        Sneaky: {
          ign: 'Sneaky',
          position: 'BOT',
          nationality: 'US',
        },
        YellOwStaR: {
          ign: 'YellOwStaR',
          position: 'BOT',
          nationality: 'FR',
        },
        Steelback: {
          ign: 'Steelback',
          position: 'BOT',
          nationality: 'FR',
        },
        Rekkles: {
          ign: 'Rekkles',
          position: 'BOT',
          nationality: 'SE',
        },
        Emperor: {
          ign: 'Emperor',
          position: 'BOT',
          nationality: 'KR',
        },
        Hjarnan: {
          ign: 'Hjarnan',
          position: 'BOT',
          nationality: 'SE',
        },
        Perkz: {
          ign: 'Perkz',
          position: 'BOT',
          nationality: 'HR',
        },
      },
      SPT: {
        Xpecial: {
          ign: 'Xpecial',
          position: 'SPT',
          nationality: 'CA',
        },
        Lustboy: {
          ign: 'Lustboy',
          position: 'SPT',
          nationality: 'KR',
        },
        Biofrost: {
          ign: 'Biofrost',
          position: 'SPT',
          nationality: 'CA',
        },
        Mithy: {
          ign: 'Mithy',
          position: 'SPT',
          nationality: 'ES',
        },
        Treatz: {
          ign: 'Treatz',
          position: 'SPT',
          nationality: 'SE',
        },
        SwordArt: {
          ign: 'SwordArt',
          position: 'SPT',
          nationality: 'TW',
        },
        CoreJJ: {
          ign: 'CoreJJ',
          position: 'SPT',
          nationality: 'KR',
        },
        Zeyzal: {
          ign: 'Zeyzal',
          position: 'SPT',
          nationality: 'US',
        },
        Vulcan: {
          ign: 'Vulcan',
          position: 'SPT',
          nationality: 'CA',
        },
        NRated: {
          ign: 'NRated',
          position: 'SPT',
          nationality: 'DE',
        },
        YellOwStaR: {
          ign: 'YellOwStaR',
          position: 'SPT',
          nationality: 'FR',
        },
        Hylissang: {
          ign: 'Hylissang',
          position: 'SPT',
          nationality: 'BG',
        },
        Hybrid: {
          ign: 'Hybrid',
          position: 'SPT',
          nationality: 'NL',
        },
        Wadid: {
          ign: 'Wadid',
          position: 'SPT',
          nationality: 'KR',
        },
        Mikyx: {
          ign: 'Mikyx',
          position: 'SPT',
          nationality: 'SI',
        },
      },
    };

    const teams = {
      TSM: {
        name: ["Team Solo Mid"],
        abbr: "TSM",
        region: "NA",
      },
      TL: {
        name: ["Team Liquid", "liquid"],
        abbr: "TL",
        region: "NA",
      },
      C9: {
        name: ["Cloud 9", "cloud nine"],
        abbr: "C9",
        region: "NA",
      },
      FNC: {
        name: ["Fnatic"],
        abbr: "FNC",
        region: "EU",
      },
      G2: {
        name: ["G2 Esports"],
        abbr: "G2",
        region: "EU",
      },
    };

    const data = [
        {
          team: teams.TSM,
          year: '2013',
          split: 'spring',
          region: "NA",
          players: {
            TOP: players.TOP.Dyrus,
            JG: players.JG.TheOddOne,
            MID: players.MID.Reginald,
            BOT: players.BOT.Chaox,
            SPT: players.SPT.Xpecial,
          },
        },
        {
          team: teams.TSM,
          year: '2013',
          split: 'summer',
          region: "NA",
          players: {
            TOP: players.TOP.Dyrus,
            JG: players.JG.TheOddOne,
            MID: players.MID.Reginald,
            BOT: players.BOT.WildTurtle,
            SPT: players.SPT.Xpecial,
          },
        },
        {
          team: teams.TSM,
          year: '2014',
          split: 'spring',
          region: "NA",
          players: {
            TOP: players.TOP.Dyrus,
            JG: players.JG.TheOddOne,
            MID: players.MID.Bjergsen,
            BOT: players.BOT.WildTurtle,
            SPT: players.SPT.Xpecial,
          },
        },
        {
          team: teams.TSM,
          year: '2014',
          split: 'summer',
          region: "NA",
          players: {
            TOP: players.TOP.Dyrus,
            JG: players.JG.Amazing,
            MID: players.MID.Bjergsen,
            BOT: players.BOT.WildTurtle,
            SPT: players.SPT.Lustboy,
          },
        },
        {
          team: teams.TSM,
          year: '2016',
          split: 'summer',
          region: "NA",
          players: {
            TOP: players.TOP.Hauntzer,
            JG: players.JG.Svenskeren,
            MID: players.MID.Bjergsen,
            BOT: players.BOT.Doublelift,
            SPT: players.SPT.Biofrost,
          },
        },
        {
          team: teams.TSM,
          year: '2018',
          split: 'summer',
          region: "NA",
          players: {
            TOP: players.TOP.BrokenBlade,
            JG: players.JG.Grig,
            MID: players.MID.Bjergsen,
            BOT: players.BOT.Zven,
            SPT: players.SPT.Mithy,
          },
        },
        {
          team: teams.TSM,
          year: '2020',
          split: 'summer',
          region: "NA",
          players: {
            TOP: players.TOP.BrokenBlade,
            JG: players.JG.Spica,
            MID: players.MID.Bjergsen,
            BOT: players.BOT.Doublelift,
            SPT: players.SPT.Treatz,
          },
        },
        {
          team: teams.TSM,
          year: '2021',
          split: 'spring',
          region: "NA",
          players: {
            TOP: players.TOP.Huni,
            JG: players.JG.Spica,
            MID: players.MID.PowerOfEvil,
            BOT: players.BOT.Lost,
            SPT: players.SPT.SwordArt,
          },
        },
        {
          team: teams.TL,
          year: '2019',
          split: 'spring',
          region: 'NA',
          players: {
            TOP: players.TOP.Impact,
            JG: players.JG.Xmithie,
            MID: players.MID.Jensen,
            BOT: players.BOT.Doublelift,
            SPT: players.SPT.CoreJJ,
          },
        },
        {
          team: teams.TL,
          year: '2021',
          split: 'spring',
          region: 'NA',
          players: {
            TOP: players.TOP.Alphari,
            JG: players.JG.Santorin,
            MID: players.MID.Jensen,
            BOT: players.BOT.Tactical,
            SPT: players.SPT.CoreJJ,
          },
        },
        {
          team: teams.C9,
          year: '2018',
          split: 'summer',
          region: 'NA',
          players: {
            TOP: players.TOP.Licorice,
            JG: players.JG.Svenskeren,
            MID: players.MID.Jensen,
            BOT: players.BOT.Sneaky,
            SPT: players.SPT.Zeyzal,
          },
        },
        {
          team: teams.C9,
          year: '2021',
          split: 'spring',
          region: 'NA',
          players: {
            TOP: players.TOP.Fudge,
            JG: players.JG.Blaber,
            MID: players.MID.Perkz,
            BOT: players.BOT.Zven,
            SPT: players.SPT.Vulcan,
          },
        },
        {
          team: teams.FNC,
          year: '2013',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.sOAZ,
            JG: players.JG.Cyanide,
            MID: players.MID.XPeke,
            BOT: players.BOT.YellOwStaR,
            SPT: players.SPT.NRated,
          },
        },
        {
          team: teams.FNC,
          year: '2015',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.Huni,
            JG: players.JG.Reignover,
            MID: players.MID.Febiven,
            BOT: players.BOT.Steelback,
            SPT: players.SPT.YellOwStaR,
          },
        },
        {
          team: teams.FNC,
          year: '2018',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.Bwipo,
            JG: players.JG.Broxah,
            MID: players.MID.Caps,
            BOT: players.BOT.Rekkles,
            SPT: players.SPT.Hylissang,
          },
        },
        {
          team: teams.FNC,
          year: '2020',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.Bwipo,
            JG: players.JG.Selfmade,
            MID: players.MID.Nemesis,
            BOT: players.BOT.Rekkles,
            SPT: players.SPT.Hylissang,
          },
        },
        {
          team: teams.G2,
          year: '2016',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.Kikis,
            JG: players.JG.Trick,
            MID: players.MID.Perkz,
            BOT: players.BOT.Emperor,
            SPT: players.SPT.Hybrid,
          },
        },
        {
          team: teams.G2,
          year: '2018',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.Wunder,
            JG: players.JG.Jankos,
            MID: players.MID.Perkz,
            BOT: players.BOT.Hjarnan,
            SPT: players.SPT.Wadid,
          },
        },
        {
          team: teams.G2,
          year: '2019',
          split: 'spring',
          region: 'EU',
          players: {
            TOP: players.TOP.Wunder,
            JG: players.JG.Jankos,
            MID: players.MID.Caps,
            BOT: players.BOT.Perkz,
            SPT: players.SPT.Mikyx,
          },
        },
      ];

    /* src/components/Player.svelte generated by Svelte v3.38.3 */

    function add_css$5() {
    	var style = element("style");
    	style.id = "svelte-1awyfcs-style";
    	style.textContent = "img.svelte-1awyfcs{width:100px}";
    	append(document.head, style);
    }

    function create_fragment$5(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	return {
    		c() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = `assets/${/*player*/ ctx[0].nationality}.png`)) attr(img, "src", img_src_value);
    			attr(img, "alt", img_alt_value = /*player*/ ctx[0].nationality);
    			attr(img, "class", "svelte-1awyfcs");
    			attr(div, "class", "player-wrapper");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, img);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*player*/ 1 && img.src !== (img_src_value = `assets/${/*player*/ ctx[0].nationality}.png`)) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*player*/ 1 && img_alt_value !== (img_alt_value = /*player*/ ctx[0].nationality)) {
    				attr(img, "alt", img_alt_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { player } = $$props;

    	$$self.$$set = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    	};

    	return [player];
    }

    class Player extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-1awyfcs-style")) add_css$5();
    		init(this, options, instance$2, create_fragment$5, safe_not_equal, { player: 0 });
    	}
    }

    /* src/components/Input.svelte generated by Svelte v3.38.3 */

    function add_css$4() {
    	var style = element("style");
    	style.id = "svelte-w28fg3-style";
    	style.textContent = ".input-wrapper.svelte-w28fg3{display:flex;position:relative}.correct.svelte-w28fg3{font-weight:700;color:#33e04d}.incorrect.svelte-w28fg3{font-weight:700;color:#e0334d\n  }";
    	append(document.head, style);
    }

    // (22:2) {#if isAttamptCorrect}
    function create_if_block_1(ctx) {
    	let span;

    	return {
    		c() {
    			span = element("span");
    			span.textContent = "O";
    			attr(span, "class", "correct svelte-w28fg3");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (27:2) {#if showWrongIcon}
    function create_if_block(ctx) {
    	let span;

    	return {
    		c() {
    			span = element("span");
    			span.textContent = "X";
    			attr(span, "class", "incorrect svelte-w28fg3");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let div;
    	let input;
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*isAttamptCorrect*/ ctx[1] && create_if_block_1();
    	let if_block1 = /*showWrongIcon*/ ctx[2] && create_if_block();

    	return {
    		c() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr(input, "type", "text");
    			attr(input, "placeholder", /*question*/ ctx[0]);
    			attr(div, "class", "input-wrapper svelte-w28fg3");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, input);
    			append(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t1);
    			if (if_block1) if_block1.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*handleInputChange*/ ctx[3]),
    					listen(input, "keyup", /*handleInputEnterPress*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*question*/ 1) {
    				attr(input, "placeholder", /*question*/ ctx[0]);
    			}

    			if (/*isAttamptCorrect*/ ctx[1]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1();
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showWrongIcon*/ ctx[2]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block();
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { question } = $$props;
    	let { answer } = $$props;
    	let isAttamptCorrect;
    	let showWrongIcon;

    	function handleInputChange(e) {
    		$$invalidate(1, isAttamptCorrect = answer.map(a => a.toLowerCase()).includes(e.target.value.toLowerCase()));
    		$$invalidate(2, showWrongIcon = false);
    	}

    	function handleInputEnterPress(e) {
    		if (e.key !== "Enter") {
    			return;
    		}

    		$$invalidate(2, showWrongIcon = !isAttamptCorrect);
    	}

    	$$self.$$set = $$props => {
    		if ("question" in $$props) $$invalidate(0, question = $$props.question);
    		if ("answer" in $$props) $$invalidate(5, answer = $$props.answer);
    	};

    	return [
    		question,
    		isAttamptCorrect,
    		showWrongIcon,
    		handleInputChange,
    		handleInputEnterPress,
    		answer
    	];
    }

    class Input extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-w28fg3-style")) add_css$4();
    		init(this, options, instance$1, create_fragment$4, safe_not_equal, { question: 0, answer: 5 });
    	}
    }

    /* src/components/Quiz.svelte generated by Svelte v3.38.3 */

    function add_css$3() {
    	var style = element("style");
    	style.id = "svelte-15dfkxq-style";
    	style.textContent = ".quiz-container.svelte-15dfkxq{display:flex;flex-direction:column;align-items:center;width:100%}.player-container.svelte-15dfkxq{display:flex;flex-direction:row;justify-content:space-between;width:100%}.team-input.svelte-15dfkxq{margin:1em 0}.player-name-input.svelte-15dfkxq{display:flex;justify-content:space-between;width:100%}";
    	append(document.head, style);
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div0;
    	let player0;
    	let t0;
    	let player1;
    	let t1;
    	let player2;
    	let t2;
    	let player3;
    	let t3;
    	let player4;
    	let t4;
    	let div1;
    	let input0;
    	let t5;
    	let input1;
    	let t6;
    	let input2;
    	let t7;
    	let div2;
    	let input3;
    	let t8;
    	let input4;
    	let t9;
    	let input5;
    	let t10;
    	let input6;
    	let t11;
    	let input7;
    	let current;

    	player0 = new Player({
    			props: { player: /*quiz*/ ctx[0].players.TOP }
    		});

    	player1 = new Player({
    			props: { player: /*quiz*/ ctx[0].players.JG }
    		});

    	player2 = new Player({
    			props: { player: /*quiz*/ ctx[0].players.MID }
    		});

    	player3 = new Player({
    			props: { player: /*quiz*/ ctx[0].players.BOT }
    		});

    	player4 = new Player({
    			props: { player: /*quiz*/ ctx[0].players.SPT }
    		});

    	input0 = new Input({
    			props: {
    				question: "Team",
    				answer: [.../*quiz*/ ctx[0].team.name, /*quiz*/ ctx[0].team.abbr]
    			}
    		});

    	input1 = new Input({
    			props: {
    				question: "Year",
    				answer: [/*quiz*/ ctx[0].year]
    			}
    		});

    	input2 = new Input({
    			props: {
    				question: "Split",
    				answer: [/*quiz*/ ctx[0].split]
    			}
    		});

    	input3 = new Input({
    			props: {
    				question: "Top",
    				answer: [/*quiz*/ ctx[0].players.TOP.ign]
    			}
    		});

    	input4 = new Input({
    			props: {
    				question: "Jungle",
    				answer: [/*quiz*/ ctx[0].players.JG.ign]
    			}
    		});

    	input5 = new Input({
    			props: {
    				question: "Mid",
    				answer: [/*quiz*/ ctx[0].players.MID.ign]
    			}
    		});

    	input6 = new Input({
    			props: {
    				question: "Bot",
    				answer: [/*quiz*/ ctx[0].players.BOT.ign]
    			}
    		});

    	input7 = new Input({
    			props: {
    				question: "Support",
    				answer: [/*quiz*/ ctx[0].players.SPT.ign]
    			}
    		});

    	return {
    		c() {
    			div3 = element("div");
    			div0 = element("div");
    			create_component(player0.$$.fragment);
    			t0 = space();
    			create_component(player1.$$.fragment);
    			t1 = space();
    			create_component(player2.$$.fragment);
    			t2 = space();
    			create_component(player3.$$.fragment);
    			t3 = space();
    			create_component(player4.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			create_component(input0.$$.fragment);
    			t5 = space();
    			create_component(input1.$$.fragment);
    			t6 = space();
    			create_component(input2.$$.fragment);
    			t7 = space();
    			div2 = element("div");
    			create_component(input3.$$.fragment);
    			t8 = space();
    			create_component(input4.$$.fragment);
    			t9 = space();
    			create_component(input5.$$.fragment);
    			t10 = space();
    			create_component(input6.$$.fragment);
    			t11 = space();
    			create_component(input7.$$.fragment);
    			attr(div0, "class", "player-container svelte-15dfkxq");
    			attr(div1, "class", "team-input svelte-15dfkxq");
    			attr(div2, "class", "player-name-input svelte-15dfkxq");
    			attr(div3, "class", "quiz-container svelte-15dfkxq");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div0);
    			mount_component(player0, div0, null);
    			append(div0, t0);
    			mount_component(player1, div0, null);
    			append(div0, t1);
    			mount_component(player2, div0, null);
    			append(div0, t2);
    			mount_component(player3, div0, null);
    			append(div0, t3);
    			mount_component(player4, div0, null);
    			append(div3, t4);
    			append(div3, div1);
    			mount_component(input0, div1, null);
    			append(div1, t5);
    			mount_component(input1, div1, null);
    			append(div1, t6);
    			mount_component(input2, div1, null);
    			append(div3, t7);
    			append(div3, div2);
    			mount_component(input3, div2, null);
    			append(div2, t8);
    			mount_component(input4, div2, null);
    			append(div2, t9);
    			mount_component(input5, div2, null);
    			append(div2, t10);
    			mount_component(input6, div2, null);
    			append(div2, t11);
    			mount_component(input7, div2, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(player0.$$.fragment, local);
    			transition_in(player1.$$.fragment, local);
    			transition_in(player2.$$.fragment, local);
    			transition_in(player3.$$.fragment, local);
    			transition_in(player4.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(input7.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(player0.$$.fragment, local);
    			transition_out(player1.$$.fragment, local);
    			transition_out(player2.$$.fragment, local);
    			transition_out(player3.$$.fragment, local);
    			transition_out(player4.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(input7.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			destroy_component(player0);
    			destroy_component(player1);
    			destroy_component(player2);
    			destroy_component(player3);
    			destroy_component(player4);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(input7);
    		}
    	};
    }

    function instance($$self) {
    	const rng = Math.floor(Math.random() * Object.entries(data).length);
    	const quiz = data[rng];
    	return [quiz];
    }

    class Quiz extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-15dfkxq-style")) add_css$3();
    		init(this, options, instance, create_fragment$3, safe_not_equal, {});
    	}
    }

    /* src/components/Rules.svelte generated by Svelte v3.38.3 */

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-tcv1g3-style";
    	style.textContent = ".rules-container.svelte-tcv1g3.svelte-tcv1g3{display:flex;flex-direction:column;align-items:center}.rules-ul.svelte-tcv1g3.svelte-tcv1g3{margin:0;list-style:none}.rules-ul.svelte-tcv1g3>li.svelte-tcv1g3::before{content:'・'}";
    	append(document.head, style);
    }

    function create_fragment$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");

    			div.innerHTML = `<h3 class="rules-title">Rules</h3> 
  <ul class="rules-ul svelte-tcv1g3"><li class="svelte-tcv1g3">Including NALCS, LCS, EULCS, LEC teams. Academy rosters are not included.</li> 
    <li class="svelte-tcv1g3">From 2013 spring to 2021 summer.</li> 
    <li class="svelte-tcv1g3">If a roster exists for over a split, the answer is the first split in that period.</li></ul>`;

    			attr(div, "class", "rules-container svelte-tcv1g3");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class Rules extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-tcv1g3-style")) add_css$2();
    		init(this, options, null, create_fragment$2, safe_not_equal, {});
    	}
    }

    /* src/components/Layout.svelte generated by Svelte v3.38.3 */

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-1honecq-style";
    	style.textContent = ".layout-container.svelte-1honecq{height:calc(100% - 4em);width:calc(100% - 4em);display:flex;flex-direction:column;justify-content:center;padding:2em}";
    	append(document.head, style);
    }

    function create_fragment$1(ctx) {
    	let div;
    	let title;
    	let t0;
    	let quiz;
    	let t1;
    	let rules;
    	let current;
    	title = new Title({});
    	quiz = new Quiz({});
    	rules = new Rules({});

    	return {
    		c() {
    			div = element("div");
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(quiz.$$.fragment);
    			t1 = space();
    			create_component(rules.$$.fragment);
    			attr(div, "class", "layout-container svelte-1honecq");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(title, div, null);
    			append(div, t0);
    			mount_component(quiz, div, null);
    			append(div, t1);
    			mount_component(rules, div, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(quiz.$$.fragment, local);
    			transition_in(rules.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(quiz.$$.fragment, local);
    			transition_out(rules.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(title);
    			destroy_component(quiz);
    			destroy_component(rules);
    		}
    	};
    }

    class Layout extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-1honecq-style")) add_css$1();
    		init(this, options, null, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.3 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-17pnb6i-style";
    	style.textContent = ".app.svelte-17pnb6i{height:100vh;width:100%}";
    	append(document.head, style);
    }

    function create_fragment(ctx) {
    	let div;
    	let layout;
    	let current;
    	layout = new Layout({});

    	return {
    		c() {
    			div = element("div");
    			create_component(layout.$$.fragment);
    			attr(div, "class", "app svelte-17pnb6i");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(layout, div, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(layout);
    		}
    	};
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-17pnb6i-style")) add_css();
    		init(this, options, null, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: 'asuka'
      }
    });

    return app;

}());
