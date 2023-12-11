<script>
  import { fade } from 'svelte/transition';

  export let joinLink = '';

  function handleJoinLinkCopy() {
    navigator.clipboard.writeText(joinLink);
  }
</script>

<div class="main_modal" in:fade={{ duration: 1500 }}>
  <h1>Thick-Tac-Toe</h1>

  <div class="join_info">
    <p class="join_title">Join Link</p>

    <div class="join_link_container">
      <input class="join_link" value={joinLink} readonly />

      <button class="join_link_copy_btn" on:click={handleJoinLinkCopy}>
        <span class="material-symbols-outlined">content_copy</span>
      </button>
    </div>
  </div>

  <div class="description">
    <p>
      Tic-tac-toe... but a thick fog covers your sight and you can only see part
      of the massive board at a time. Trust in your memory and instincts to make
      a five-long line before your treacherous opponent.
    </p>

    <p>[Yes, a better description is pending.]</p>
  </div>
</div>

<style>
  .main_modal {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    width: min(75ch, 90vw);
    padding: 2rem;

    display: flex;
    flex-direction: column;
    align-items: center;

    color: white;
    font-family: 'Kalnia', serif;
    font-weight: 300;

    background-color: rgb(132 85 0 / 0.5);
    border-radius: 0.75vmax 0.45vmax 0.8vmax 0.3vmax;

    /* TODO: Ideally reflect this directly instead of using opacity. */
    /* We need a main modal that stands out less/is darker.*/
    opacity: 0.75;
  }

  .main_modal > h1 {
    font-size: min(calc(1.6rem + 2vmin), 3rem);
  }

  .join_info {
    /* Allow children to expand freely within the rest of the container. */
    width: 100%;

    margin: 1rem;
    margin-bottom: 1.75rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .join_title {
    font-weight: 400;
  }

  .join_link_container {
    /* Allow children to expand freely within the rest of the container. */
    width: 100%;

    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .join_link {
    flex: 1;
    max-width: 50ch;

    appearance: none;
    padding: 0.25rem 0.5rem;
    border: none;

    color: white;
    font-family: 'Kalnia';

    background-color: #7c540a;
    border-radius: 0.3rem 0.1rem 0.35rem 0.4rem;
  }

  .join_link:hover {
    background-color: #895d0b;
  }

  .join_link_copy_btn {
    width: 2.3rem;
    height: 2.3rem;

    color: white;

    border: none;
    background-color: #7c780a;
    border-radius: 0.1rem 0.4rem 0.3rem 0.35rem;
  }

  .join_link_copy_btn:hover {
    background-color: #9b960d;
  }

  .join_link_copy_btn:active {
    background-color: #6a6708;
  }

  .description {
    max-width: 70ch;

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
