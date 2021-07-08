<script>
  import Fa from 'svelte-fa';
  import { faTwitter, faGithub } from '@fortawesome/free-brands-svg-icons';
</script>

<div class="footer-wrapper">
  <a href="https://twitter.com/asukachikaru" rel="noreferrer noopener" target="_blank"><Fa icon={faTwitter} /></a>
  <a href="https://github.com/AsukaCHikaru/lcs-lec-flag-quiz" rel="noreferrer noopener" target="_blank"><Fa icon={faGithub} /></a>
</div>

<style>
  .footer-wrapper {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  a {
    margin: 0 10px;
    font-size: 20px;
  }
</style>