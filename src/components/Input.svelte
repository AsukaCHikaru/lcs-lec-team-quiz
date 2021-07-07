<script>
  export let question;
  export let answer;
  let isAttamptCorrect;
  let showWrongIcon;

  function handleInputChange(e) {
    isAttamptCorrect = answer.map((a) => a.toLowerCase()).includes(e.target.value.toLowerCase());
    showWrongIcon = false;
  }

  function handleInputEnterPress(e) {
    if (e.key !== 'Enter') {
      return;
    }
    showWrongIcon = !isAttamptCorrect;
  }
</script>

<div class="input-wrapper">
  <input type="text" placeholder={question} on:input={handleInputChange} on:keyup={handleInputEnterPress} />
  {#if isAttamptCorrect}
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
