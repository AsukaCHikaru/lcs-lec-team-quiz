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
    height: calc(100vh - 48px);
    max-width: 800px;
    margin: auto;
    padding: 24px 0;
    display: flex;
    flex-direction: column;
  }
  .content-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media (max-width: 799px) {
    .layout-container {
      padding: 24px 12px;
      height: calc(100% - 48px);
    }
  }

  @media (max-width: 320px) {
    .layout-container {
      padding: 12px;
    }
  }
</style>