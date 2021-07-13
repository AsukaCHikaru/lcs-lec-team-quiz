<script>
  export let question;
  export let onChange;
  export let onEnter;
  export let value;
  let isSubmitted = false;

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
  }

  // Reset submitted state when quiz is reset
  $: if (value === '') {
    isSubmitted = false;
  }
</script>

<div class="input-wrapper">
  <input type="text" bind:value={value} placeholder={question[0].toUpperCase() + question.substr(1)} on:input={handleInputChange} on:keyup={handleInputEnterPress} />
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    margin: 24px;
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
