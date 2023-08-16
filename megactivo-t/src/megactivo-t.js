import { LitElement, html, css } from 'lit';
import { pwaStyle } from './style.js';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvV0oSg6a0BsKdMiyGSkY5JhJDujLuvuY",
  authDomain: "megactivot.firebaseapp.com",
  projectId: "megactivot",
  storageBucket: "megactivot.appspot.com",
  messagingSenderId: "808982428369",
  appId: "1:808982428369:web:cac15d5a8adca1ff17e3f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const logo = new URL('../assets/open-wc-logo.svg', import.meta.url).href;
const bot = new URL('../assets/bot.svg', import.meta.url).href;
const user = new URL('../assets/user.svg', import.meta.url).href;

let loadInterval;

function loader(element) {
  element.textContent = ''

  loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += '.';

      // If the loading indicator has reached three dots, reset it
      if (element.textContent === '....') {
          element.textContent = '';
      }
  }, 300);
}

function typeText(element, text) {
  let index = 0

  let interval = setInterval(() => {
      if (index < text.length) {
          element.innerHTML += text.charAt(index)
          index++
      } else {
          clearInterval(interval)
      }
  }, 20)
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

class MegactivoT extends LitElement {
  static get properties() {
    return {
      taskId: { type: Number },
      conversation: { type: Array },
    };
  }

  get form() {
    return this.renderRoot?.querySelector('#form') ?? null;
  }

  get chatContainer() {
    return this.renderRoot?.querySelector('#chat_container') ?? null;
  }

  static get styles() {
    return [
      pwaStyle, 
      css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: #1a2b42;
        max-width: 960px;
        margin: 0 auto;
        //text-align: center;
        background-color: var(--megactivo-t-background-color);
      }

      main {
        flex-grow: 1;
      }

      .logo {
        margin-top: 36px;
        animation: app-logo-spin infinite 20s linear;
      }

      @keyframes app-logo-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }

    `];
  }

  constructor() {
    super();
    this.taskId = 0;
    this.conversation = [
      {role: 'system', content: 'you are friendly assistant that answers only things related to the company megactivo.com which offers an accounting and administrative app. If the user asks things that are not related to this company, do not answer the question but rather advise them respectfuly that only things related to megactivo.com can be answered.'}
    ];
  }

  firstUpdated() {
    //this.form = this.shadowRoot.querySelector('#form');
    //this.chatContainer = this.shadowRoot.querySelector('#chat_container');
    this.form.addEventListener('submit', (e) => {this.handleSubmit(e)});
    this.form.addEventListener('keyup', (e) => {
      if (e.keyCode === 13) {
        this.handleSubmit(e)
      }
    });
  }

  render() {
    return html`
      <main>
        <div id="app">
          <div id="chat_container"></div>
          <form id="form">
            <textarea name="prompt" rows="1" cols="1" placeholder="Pregunta sobre Megactivo..."></textarea>
            <button type="submit"><img src="assets/send.svg" /></button>
          </form>
        </div>
      </main>
    `;
  }

  chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
  }

  async handleSubmit(e) {
    e.preventDefault()
    const data = new FormData(this.form);

    // user's chatstripe
    this.chatContainer.innerHTML += this.chatStripe(false, data.get('prompt'));

    if (this.taskId==2)
        this.conversation.push({role: 'user', content: data.get('prompt')});

    // to clear the textarea input 
    this.form.reset()

    // bot's chatstripe
    const uniqueId = generateUniqueId()
    this.chatContainer.innerHTML += this.chatStripe(true, " ", uniqueId)

    // to focus scroll to the bottom 
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;

    // specific message div 
    // const messageDiv = document.getElementById(uniqueId)
    const messageDiv = this.shadowRoot.getElementById(uniqueId);

    // messageDiv.innerHTML = "..."
    loader(messageDiv)

    let response;

    //response = await fetch("http://localhost:5000", {
    response = await fetch("https://megactivot.onrender.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `${(this.taskId==2) ? this.conversation : data.get("prompt")}`,
          taskId: this.taskId,
        }),
    });
    

    clearInterval(loadInterval)
    messageDiv.innerHTML = " "

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim(); // trims any trailing spaces/'\n' 
      if (this.taskId==2)
        this.conversation.push({role: 'assistant', content: parsedData});
      typeText(messageDiv, parsedData);
    } else {
      const err = await response.text();
      messageDiv.innerHTML = "Something went wrong"
      alert(err)
      console.log(err)
    }

  }

}

customElements.define('megactivo-t', MegactivoT);