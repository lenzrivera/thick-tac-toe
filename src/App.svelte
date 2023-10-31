<div class="main_modal">
  <h1>thick-tac-toe</h1>

  <div class="join_info">
    <p>join link:</p>
    <input value={location.href} readonly />
    <button><span class="material-symbols-outlined">content_copy</span></button>
  </div>

  <div class="description">
    <p>
      lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet, nesciunt
      mollitia fugit explicabo, aperiam quidem officia, reiciendis distinctio
      doloribus vitae sint perspiciatis? Vitae exercitationem quaerat eligendi
      dolor eius cupiditate sed.
    </p>
    <p>
      lorem ipsum dolor, sit amet consectetur adipisicing elit. Nostrum, maiores
      omnis. Itaque consectetur quasi dolorem qui assumenda inventore nihil
      aspernatur beatae repellat in debitis, porro modi laudantium eos,
      exercitationem laborum?
    </p>
  </div>
</div>

<div class="fog"></div>

<style>
  .fog {
    --visible-radius: 500px;

    position: fixed;
    inset: 0;

    pointer-events: none;
  }

  .fog:not(.hidden)::after {
    content: "";

    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    width: var(--visible-radius);
    height: var(--visible-radius);

    border-radius: 100%;
    box-shadow: 0px 0px 0px 100vmax black;
  }

  .main_modal {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;

    width: min(75ch, 90vw);
    padding: 1.5rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    background-color: rgba(0 0 0 / 0.3);
    border-radius: 0.75vmin;
  }

  .join_info {
    display: grid;
    grid-template-columns: auto minmax(0, 40ch) auto;
    align-items: center;
    gap: 1rem;
  }

  .description {
    max-width: 70ch;

    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
