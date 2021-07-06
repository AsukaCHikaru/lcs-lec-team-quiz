<script>
  export let player;

  console.log(player);
</script>

<div class="player-wrapper">
  <img src={`../assets/${player.nationality}.png`} alt={player.nationality}>
</div>

<style>
  img {
    width: 100px;
  }
</style>