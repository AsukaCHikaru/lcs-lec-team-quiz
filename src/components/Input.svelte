<script>
  import Fa from 'svelte-fa';
  import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

  export let question;
  export let onChange;
  export let onEnter;
  export let value;
  export let isPrevQCorrect;
  let isSubmitted = false;
  let showIcon = false;
  let showIconTimeout;

  function handleInputChange(e) {
    onChange(question.toLowerCase(), e.target.value);
    isSubmitted = false;
  }

  function handleInputEnterPress(e) {
    if (e.key !== 'Enter') {
      return;
    }
    isSubmitted = true;
    onEnter(question.toLowerCase());
    showIcon = true;
    if (showIconTimeout) {
      clearTimeout(showIconTimeout);
    }
    showIconTimeout = setTimeout(() => {
      showIcon = false;
      clearTimeout(showIconTimeout);
    }, 1000);
  }

  // Reset submitted state when quiz is reset
  $: if (value === '') {
    isSubmitted = false;
  }

  function handleFocus () {
    setTimeout(() => {
      window.scrollTo(0, 100);
    }, 200);
  }
</script>

<div class="input-wrapper">
  <div class="input-icon-wrapper" class:show={showIcon}>
    <Fa icon={isPrevQCorrect ? faCheck : faTimes} color={isPrevQCorrect ? '#12ed28' : '#ed1228'} />
  </div>
  <input
    type="text"
    bind:value={value}
    placeholder={question[0].toUpperCase() + question.substr(1)}
    on:input={handleInputChange}
    on:keyup={handleInputEnterPress}
    on:focus={handleFocus}
  />
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    margin: 24px;
  }

  .input-icon-wrapper {
    margin: 0 0 12px 0;
    visibility: hidden;
  }

  .show {
    visibility: visible;
    animation: fadeout 1s ease-out 1;
  }

  @keyframes fadeout {
    0% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }

    100% {
      opacity: 0;
    }
  }

  input {
    max-width: 144px;
    height: 28px;
    background-color: #232624;
    border: solid 1px #efefef;
    color: #efefef;
    font-size: 24px;
    text-align: center;
  }
  input:focus{
    outline: none;
  }
  input::-webkit-input-placeholder, input::-moz-placeholder, input:-ms-input-placeholder, input:-moz-placeholder {
    font-weight: 100;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }

  @media (max-width: 799px) {
    .input-wrapper {
      margin: 12px;
    }
    input {
      font-size: 16px;
    }
  }

  @media (max-width: 320px) {
    .input-wrapper {
      margin: 12px;
    }
    input {
      font-size: 12px;
      height: 20px;
      max-width: 96px;
    }
  }
</style>
