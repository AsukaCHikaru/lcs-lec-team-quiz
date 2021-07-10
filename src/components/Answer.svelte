<script>
  export let question;
  export let answer;
  export let isCurrentAnswering;
  export let isCorrect;
</script>

<div class="answer-wrapper" class:current={isCurrentAnswering}>
  <h4 class="answer-title">{question}</h4>
  <h5 class="answer-content">{isCorrect ? answer : '-'}</h5>
</div>

<style>
  .answer-wrapper {
    width: 100px;
    margin: 10px 0;
    text-align: center;
  }

  .current {
    animation: flash 2s linear infinite;
  }

  @keyframes flash {
    0% {
      background-color: #ffffff;
    }

    50% {
      background-color: #aaaaaa;
    }

    100% {
      background-color: #ffffff;
    }
  }
</style>