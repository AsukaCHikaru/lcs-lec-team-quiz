<script>
  import Fa from 'svelte-fa'
  import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

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
  <div class="icon-container">
    <span class="correct" class:hide={!isCorrect}>
      <Fa icon={faCheck} />
    </span>
    <span class="incorrect" class:hide={!showWrongIcon}>
      <Fa icon={faTimes} />
    </span>
  </div>
  <input type="text" bind:value={value} placeholder={question} on:input={handleInputChange} on:keyup={handleInputEnterPress} />
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    margin: 10px;
  }

  input {
    max-width: 100px;
  }

  .icon-container {
    position: relative;
    display: flex;
    justify-content: center;
  }

  span {
    position: absolute;
    bottom: 0;
  }
  .hide {
    visibility: hidden;
  }

  .correct {
    color: #33e04d;
  }

  .incorrect {
    color: #e0334d
  }
</style>
