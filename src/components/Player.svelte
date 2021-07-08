<script>
  import { positionNameMap } from '../constants/string';

  export let player;
</script>

<div class="player-wrapper">
  <h3>{positionNameMap[player.position.toLowerCase()]}</h3>
  <img src={`assets/${player.nationality}.png`} alt={player.nationality}>
</div>

<style>
  .player-wrapper {
    margin: 0 10px;
  }
  h3 {
    text-align: center;
  }
  img {
    width: 100px;
  }
</style>