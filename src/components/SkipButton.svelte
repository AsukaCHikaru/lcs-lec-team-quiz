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
    margin: 24px 0;
    width: 96px;
  }
  button {
    width: 100%;
    background-color: #efefef;
    border: none;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 100;
    font-size: 24px;
  }

  @media (max-width: 799px) {
    .wrapper {
      margin: 12px 0;
    }

    button {
      font-size: 16px;
    }
  }
</style>