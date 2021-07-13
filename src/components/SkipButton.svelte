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
    width: 100px;
  }
  button {
    width: 100%;
    background-color: #efefef;
    border: none;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 100;
    font-size: 24px;
  }
</style>