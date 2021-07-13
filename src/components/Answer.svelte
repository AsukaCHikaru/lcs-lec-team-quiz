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
    width: 100%;
    margin: 24px 0;
    text-align: center;
    color: #efefef;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .answer-title {
    margin: 0;
    font-weight: 700;
    font-size: 24px;
    line-height: 1;
  }
  .answer-content {
    margin: 24px 0 0 0;
    font-weight: 200;
    font-size: 16px;
    line-height: 1;
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

  @media (max-width: 799px) {
    .answer-wrapper {
      margin: 12px 0;
    }
    .answer-title {
      margin: 0;
      font-size: 12px;
    }
    .answer-content {
      margin: 12px 0 0 0;
      font-size: 11px;
    }
  }
</style>