import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import '../styles/terminal.css';

type TerminalView = 'home' | 'projects' | 'contact' | 'help';

interface TerminalChapterProps {
  active: boolean;
  reducedMotion: boolean;
}

interface Transcript {
  command: string;
  result: string;
  art?: string;
}

const PROJECTS = [
  { number: '01', type: 'PLACEHOLDER / WEB', icon: '[◈]', title: 'Lorem Ipsum', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { number: '02', type: 'PLACEHOLDER / IDENTITY', icon: '[✦]', title: 'Dolor Sit Amet', description: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
  { number: '03', type: 'PLACEHOLDER / DIGITAL', icon: '[☻]', title: 'Consectetur Adipiscing', description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
] as const;

const CAT_MESSAGES = [
  'meow. the cat approves of your curiosity.',
  'pspspspsps... connection accepted.',
  'cat.exe is purring at full capacity.',
] as const;
const CAT_ART = ' /\\_/\\\\\n( o.o )\n > ^ <';
const FORTUNES = [
  'the best interface is the one that makes someone smile.',
  'keep building small things until they become useful things.',
  'a curious mind is already halfway to a good project.',
] as const;

export function TerminalChapter({ active, reducedMotion }: TerminalChapterProps) {
  const [view, setView] = useState<TerminalView>('home');
  const [commandText, setCommandText] = useState('');
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [contactStatus, setContactStatus] = useState('');
  const [maximized, setMaximized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(0);
  const catIndex = useRef(0);
  const fortuneIndex = useRef(0);
  useEffect(() => {
    if (!active) inputRef.current?.blur();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const focusShortcut = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', focusShortcut);
    return () => window.removeEventListener('keydown', focusShortcut);
  }, [active]);

  function openView(nextView: TerminalView) {
    setView(nextView);
    outputRef.current?.scrollTo({ top: 0 });
  }

  function runCommand(raw: string) {
    const command = raw.trim().toLowerCase();
    if (!command) return;
    history.current.push(command);
    historyIndex.current = history.current.length;
    setCommandText('');

    const views: Record<string, { view: TerminalView; result: string }> = {
      home: { view: 'home', result: 'returning to /home' },
      projects: { view: 'projects', result: 'scanning /home/mustafa/projects' },
      contact: { view: 'contact', result: 'opening secure channel' },
      help: { view: 'help', result: 'printing available commands' },
      pwd: { view: 'home', result: '/home/mustafa' },
      whoami: { view: 'home', result: 'mustafa.ali · uiuc student + builder' },
      coffee: { view: 'home', result: 'brewing a fresh cup of curiosity… done.' },
    };

    if (views[command]) {
      openView(views[command].view);
      setTranscript({ command, result: views[command].result });
    } else if (command === 'clear' || command === 'cls') {
      openView('home');
      setTranscript(null);
    } else if (command === 'cat' || command === 'meow') {
      openView('home');
      setTranscript({ command, result: CAT_MESSAGES[catIndex.current % CAT_MESSAGES.length], art: CAT_ART });
      catIndex.current += 1;
    } else if (command === 'fortune') {
      openView('home');
      setTranscript({ command, result: 'fortune: ' + FORTUNES[fortuneIndex.current % FORTUNES.length] });
      fortuneIndex.current += 1;
    } else if (command === 'sudo' || command.startsWith('sudo ')) {
      openView('home');
      setTranscript({ command, result: 'sudo: curiosity is the only required privilege here.' });
    } else {
      setTranscript({ command, result: 'command not found: ' + command + '. try "help".' });
    }
  }

  function onCommandKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      historyIndex.current = Math.max(0, historyIndex.current - 1);
      setCommandText(history.current[historyIndex.current] || '');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      historyIndex.current = Math.min(history.current.length, historyIndex.current + 1);
      setCommandText(history.current[historyIndex.current] || '');
    }
  }

  function onContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactStatus('message prepared. email hello@mustafaali.org directly to send it.');
    event.currentTarget.reset();
  }

  function returnToScene() {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function closeTerminal() {
    setView('home');
    setTranscript(null);
    setCommandText('');
    returnToScene();
  }

  function newTab() {
    setView('home');
    setTranscript(null);
    setCommandText('');
  }

  return (
    <section
      className={'terminal-chapter' + (active ? ' is-active' : '')}
      aria-label="Terminal portfolio chapter"
      aria-hidden={!active}
      inert={!active}
    >
      <div className={'terminal-window' + (maximized ? ' is-maximized' : '')}>
        <div className="terminal-titlebar">
          <span className="terminal-title-icon" aria-hidden="true">&gt;_</span>
          <span className="terminal-title">mustafa@portfolio: ~ <em>bash</em></span>
          <div className="terminal-controls" role="group" aria-label="Window controls">
            <button type="button" aria-label={maximized ? 'Restore terminal window' : 'Maximize terminal window'} onClick={() => setMaximized(!maximized)} />
            <button type="button" aria-label="Minimize terminal and return to scene" onClick={returnToScene} />
            <button type="button" aria-label="Close terminal and return to scene" onClick={closeTerminal} />
          </div>
        </div>
        <div className="terminal-tabbar">
          <span className="terminal-tab"><span className="terminal-tab-dot" />mustafa@portfolio: ~</span>
          <button className="terminal-tab-new" type="button" aria-label="New terminal tab" onClick={newTab}>+</button>
          <span className="terminal-tab-meta">bash · 80×24</span>
        </div>
        <div className="terminal-content">
          <div className="terminal-main">
            <div className="terminal-output" ref={outputRef} tabIndex={0}>
              {view === 'home' && (
                <div className="terminal-view terminal-home" key="home">
                  <p className="terminal-command-line"><span>mustafa@portfolio:~$</span> whoami</p>
                  <h2 className="terminal-home-logo">MUSTAFA<span>.ALI</span></h2>
                  <p className="terminal-home-subtitle">UIUC student + builder<span className="terminal-cursor" /></p>
                  <p className="terminal-command-line"><span>mustafa@portfolio:~$</span> head ~/welcome.txt</p>
                  <div className="terminal-note">
                    <div><span>~/welcome.txt</span><span>read-only</span></div>
                    <p>Hi — I’m Mustafa, a designer and developer building clear, useful, and memorable digital experiences. Try a command or choose a shortcut below.</p>
                  </div>
                  <p className="terminal-command-line"><span>mustafa@portfolio:~$</span> ls --color=auto</p>
                  <p className="terminal-hint">alternatively, use these shortcuts:</p>
                  <div className="terminal-shortcuts">
                    <button type="button" onClick={() => runCommand('projects')}>projects</button>
                    <button type="button" onClick={() => runCommand('contact')}>contact</button>
                    <button type="button" onClick={() => runCommand('cat')}>cat</button>
                  </div>
                </div>
              )}
              {view === 'projects' && (
                <div className="terminal-view" key="projects">
                  <button className="terminal-view-back" type="button" onClick={() => runCommand('home')}>← back to home</button>
                  <p className="terminal-kicker">/home/mustafa/projects // ls -la</p>
                  <h2 className="terminal-heading">projects</h2>
                  <div className="terminal-project-grid">
                    {PROJECTS.map((project) => (
                      <a className="terminal-project-card" href="mailto:hello@mustafaali.org" key={project.number}>
                        <div className="terminal-card-top"><span>{project.number}</span><span>{project.type}</span></div>
                        <span className="terminal-card-icon" aria-hidden="true">{project.icon}</span>
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                      </a>
                    ))}
                  </div>
                  <p className="terminal-hint">placeholder files loaded. type <code>contact</code> to request the full reel.</p>
                </div>
              )}
              {view === 'contact' && (
                <div className="terminal-view" key="contact">
                  <button className="terminal-view-back" type="button" onClick={() => runCommand('home')}>← back to home</button>
                  <p className="terminal-kicker">/usr/bin/contact // establish connection</p>
                  <h2 className="terminal-heading">contact</h2>
                  <div className="terminal-contact-grid">
                    <form className="terminal-contact-form" onSubmit={onContactSubmit}>
                      <label>name<input name="name" autoComplete="name" required /></label>
                      <label>email<input type="email" name="email" autoComplete="email" required /></label>
                      <label>message<textarea name="message" required /></label>
                      <button type="submit">send_message --now ↗</button>
                      <p className="terminal-form-status" role="status">{contactStatus}</p>
                    </form>
                    <div className="terminal-contact-ascii">
                      <pre>{'  ╭────────────╮\n  │  SAY HELLO │\n  ╰─────┬──────╯\n        │\n  .─────┴─────.\n  │  READY     │\n  \'────────────\''}</pre>
                      <a href="mailto:hello@mustafaali.org">hello@mustafaali.org</a>
                    </div>
                  </div>
                </div>
              )}
              {view === 'help' && (
                <div className="terminal-view" key="help">
                  <button className="terminal-view-back" type="button" onClick={() => runCommand('home')}>← back to home</button>
                  <p className="terminal-kicker">/bin/help // available commands</p>
                  <h2 className="terminal-heading">help</h2>
                  <p className="terminal-view-copy">Try one of these commands:</p>
                  <div className="terminal-help-list">
                    {[['projects', 'list selected work'], ['contact', 'establish a connection'], ['cat', 'obviously'], ['clear', 'return to the start screen']].map(([name, detail]) => (
                      <div key={name}><code>{name}</code><span>{detail}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {transcript && (
                <div className="terminal-transcript" aria-live="polite">
                  <span className="terminal-command-echo">{transcript.command}</span>
                  <span className="terminal-command-result">{transcript.result}</span>
                  {transcript.art && <pre>{transcript.art}</pre>}
                </div>
              )}
            </div>
            <form className="terminal-command-bar" onSubmit={(event) => { event.preventDefault(); runCommand(commandText); }}>
              <label htmlFor="terminal-command-input">mustafa@portfolio:~$</label>
              <input
                id="terminal-command-input"
                ref={inputRef}
                value={commandText}
                onChange={(event) => setCommandText(event.target.value)}
                onKeyDown={onCommandKeyDown}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Terminal command"
                placeholder="type a command..."
              />
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
