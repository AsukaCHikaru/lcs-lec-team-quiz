<script>
  export let onClick;

  function handleButtonClick () {
    onClick();
  } 
</script>

<div class="wrapper">
  <button on:click={handleButtonClick}>Skip</button>
</div>

<style>
  .wrapper {
    margin: 1em;
  }
</style>