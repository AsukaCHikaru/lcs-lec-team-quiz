<script>
  import { positionNameMap } from '../constants/string';

  export let player;
</script>

<div class="player-wrapper">
  <h3>{positionNameMap[player.position.toLowerCase()]}</h3>
  <img src={`assets/${player.nationality}.png`} alt={player.nationality}>
</div>

<style>
  h3 {
    text-align: center;
  }
  img {
    width: 100px;
  }
</style>