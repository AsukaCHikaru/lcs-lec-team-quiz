<script>
  export let question;
  export let onChange;
  export let isCorrect;
  export let value;
  let showWrongIcon;

  function handleInputChange(e) {
    onChange(question.toLowerCase(), e.target.value);
    showWrongIcon = false;
  }

  function handleInputEnterPress(e) {
    if (e.key !== 'Enter') {
      return;
    }
    showWrongIcon = !isCorrect;
  }
</script>

<div class="input-wrapper">
  <input type="text" bind:value={value} placeholder={question} on:input={handleInputChange} on:keyup={handleInputEnterPress} />
  {#if isCorrect}
    <span class="correct">
      O
    </span>
  {/if}
  {#if showWrongIcon}
    <span class="incorrect">
      X
    </span>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    position: relative;
  }

  input {
    max-width: 100px;
  }

  .correct {
    font-weight: 700;
    color: #33e04d;
  }

  .incorrect {
    font-weight: 700;
    color: #e0334d
  }
</style>
