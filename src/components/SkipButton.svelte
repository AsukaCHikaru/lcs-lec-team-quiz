<script>
  export let onClick;
  export let type;

  function handleButtonClick () {
    onClick();
  } 
</script>

<div class="wrapper">
  <button on:click={handleButtonClick}>{type === 'quiz' ? 'NEXT QUIZ' : 'SKIP PART'}</button>
</div>

<style>
  .wrapper {
    margin: 24px;
    width: 192px;
  }
  button {
    width: 100%;
    background-color: #efefef;
    border: none;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 200;
    font-size: 24px;
  }

  @media (max-width: 799px) {
    .wrapper {
      margin: 12px;
      width: 96px;
    }

    button {
      font-size: 16px;
    }
  }

  @media (max-width: 320px) {
    .wrapper {
      margin: 12px;
      width: 72px;
    }

    button {
      font-size: 12px;
    }
  }
</style>