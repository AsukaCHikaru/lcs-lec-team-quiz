<script>
  import Title from './Title.svelte';
  import Quiz from './Quiz.svelte';
  import Rules from './Rules.svelte';
</script>

<div class="layout-container">
  <Title />
  <Quiz />
  <Rules />
</div>

<style>
  .layout-container {
    height: calc(100% - 4em);
    width: calc(100% - 4em);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2em;
  }
</style>