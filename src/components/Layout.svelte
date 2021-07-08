<script>
  import Title from './Title.svelte';
  import Quiz from './Quiz.svelte';
  import Rules from './Rules.svelte';
  import Footer from './Footer.svelte';
</script>

<div class="layout-container">
  <div class="content-container">
    <Title />
    <Quiz />
    <Rules />
  </div>
  <Footer />
</div>

<style>
  .layout-container {
    height: calc(100% - 4em);
    max-width: 800px;
    margin: auto;
    padding: 2em 0;
    display: flex;
    flex-direction: column;
  }
  .content-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>