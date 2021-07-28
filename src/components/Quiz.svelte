<script>
  import { onMount } from 'svelte';

  import { data } from '../constants/quizzes';
  import Player from './Player.svelte';
  import Answer from './Answer.svelte';
  import Input from './Input.svelte';
  import SkipButton from './SkipButton.svelte';
  import { generalizeName } from '../utils/stringUtils';

  let quizNo;
  let answeredPool = [];
  let quiz;
  let answerForm;
  let currentQ = 'team';
  let isPrevQCorrect = false;
  
  const fullPool = data.map((_, i) => i);
  const defaultAnswerForm = {
    team: { value: '', answer: [], correct: false },
    year: { value: '', answer: [], correct: false },
    top: { value: '', answer: [], correct: false },
    jungle: { value: '', answer: [], correct: false },
    mid: { value: '', answer: [], correct: false },
    bot: { value: '', answer: [], correct: false },
    support: { value: '', answer: [], correct: false },
  };
  let qs = [...Object.keys(defaultAnswerForm)];

  function resetAnswerForm () {
    currentQ = 'team';
    answerForm = JSON.parse(JSON.stringify(defaultAnswerForm));
  }

  function createQuiz () {
    resetAnswerForm();

    const pool = fullPool.filter(i => !answeredPool.includes(i));
    quizNo = pool[Math.floor(Math.random() * pool.length)];
    answeredPool.push(quizNo);
    quiz = data[quizNo];

    answerForm.team.answer = [...quiz.team.name.map(name => generalizeName(name)), quiz.team.abbr.toLowerCase()];
    answerForm.year.answer = quiz.year;
    answerForm.top.answer = [...quiz.players.TOP.ign.map(name => generalizeName(name))];
    answerForm.jungle.answer = [...quiz.players.JG.ign.map(name => generalizeName(name))];
    answerForm.mid.answer = [...quiz.players.MID.ign.map(name => generalizeName(name))];
    answerForm.bot.answer = [...quiz.players.BOT.ign.map(name => generalizeName(name))];
    answerForm.support.answer = [...quiz.players.SPT.ign.map(name => generalizeName(name))];
  }

  function handleInputChance (key, value) {
    answerForm[key].value = value;
  }
  
  function handleInputEnter (key) {
    if (
      key === "team" && answerForm.team.answer.includes(generalizeName(answerForm[key].value)) || 
      key === "top" && answerForm.top.answer.includes(generalizeName(answerForm[key].value)) || 
      key === "jungle" && answerForm.jungle.answer.includes(generalizeName(answerForm[key].value)) || 
      key === "mid" && answerForm.mid.answer.includes(generalizeName(answerForm[key].value)) || 
      key === "bot" && answerForm.bot.answer.includes(generalizeName(answerForm[key].value)) || 
      key === "support" && answerForm.support.answer.includes(generalizeName(answerForm[key].value)) || 
      key === "year" && answerForm[key].answer === generalizeName(answerForm[key].value)
    ) {
      isPrevQCorrect = true;
      answerForm[key].correct = true;
      qs.shift();
      if (qs.length === 0) {
        const newQuizTimeout = setTimeout(() => {
          createQuiz();
          qs = [...Object.keys(defaultAnswerForm)];
          currentQ = qs[0];
          clearTimeout(newQuizTimeout);
        }, 1000);
      }
      else {
        currentQ = qs[0];
      }
    } else {
      isPrevQCorrect = false;
    }
  }

  function handleSkipClick () {
    answerForm.team.correct = true;
    answerForm.year.correct = true;
    answerForm.top.correct = true;
    answerForm.jungle.correct = true;
    answerForm.mid.correct = true;
    answerForm.bot.correct = true;
    answerForm.support.correct = true;
    const newQuizTimeout = setTimeout(() => {
      createQuiz();
      clearTimeout(newQuizTimeout);
    }, 2000);
  }

  onMount(() => {
    createQuiz();
  });

</script>

<div class="quiz-container">
  {#if quiz}
    <div class="player-container">
      <Player
        player={quiz.players.TOP}
        showAnswer={answerForm.top.correct}
        isCurrentAnswering={currentQ === 'top'}
        isCorrect={answerForm.top.correct}
      />
      <Player
        player={quiz.players.JG}
        showAnswer={answerForm.jungle.correct}
        isCurrentAnswering={currentQ === 'jungle'}
        isCorrect={answerForm.jungle.correct}
      />
      <Player
        player={quiz.players.MID}
        showAnswer={answerForm.mid.correct}
        isCurrentAnswering={currentQ === 'mid'}
        isCorrect={answerForm.mid.correct}
      />
      <Player
        player={quiz.players.BOT}
        showAnswer={answerForm.bot.correct}
        isCurrentAnswering={currentQ === 'bot'}
        isCorrect={answerForm.bot.correct}
      />
      <Player
        player={quiz.players.SPT}
        showAnswer={answerForm.support.correct}
        isCurrentAnswering={currentQ === 'support'}
        isCorrect={answerForm.support.correct}
      />
    </div>
    <div class="team-answer-container">
      <Answer
        question="Team"
        answer={quiz.team.abbr}
        isCurrentAnswering={currentQ === 'team'}
        isCorrect={answerForm.team.correct}
      />
      <Answer
        question="Year"
        answer={quiz.year}
        isCurrentAnswering={currentQ === 'year'}
        isCorrect={answerForm.year.correct}
      />
    </div>
    <div class="input-container">
      <Input
        question={currentQ}
        onChange={handleInputChance}
        onEnter={handleInputEnter}
        value={answerForm[currentQ].value}
        isPrevQCorrect={isPrevQCorrect}
      />
    </div>
  {/if}
  <SkipButton onClick={handleSkipClick} />
</div>

<style>
  .quiz-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .player-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .team-answer-container {
    display: flex;
    justify-content: space-between;
    text-align: center;
    width: 60%;
  }
  .input-container {
    text-align: center;
  }
</style>
