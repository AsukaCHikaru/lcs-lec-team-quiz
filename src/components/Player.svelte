<script>
  export let player;
</script>

<div class="player-wrapper">
  <img src={`assets/${player.nationality}.png`} alt={player.nationality}>
</div>

<style>
  img {
    width: 100px;
  }
</style>