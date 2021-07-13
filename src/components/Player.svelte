<script>
  import { positionNameMap } from '../constants/string';

  import Answer from './Answer.svelte';

  export let player;
  export let isCurrentAnswering;
  export let isCorrect;
</script>

<div class="player-wrapper">
  <img src={`assets/${player.nationality}.png`} alt={player.nationality}>
  <Answer
    question={positionNameMap[player.position.toLowerCase()]}
    answer={player.ign}
    isCurrentAnswering={isCurrentAnswering}
    isCorrect={isCorrect}
  />
</div>

<style>

  .player-wrapper {
    display: flex;
    flex-direction: column;
  }
  img {
    width: 87px;
  }
</style>