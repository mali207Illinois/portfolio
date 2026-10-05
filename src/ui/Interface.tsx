import { useEffect, useRef, useState } from 'react';

const projects = ['Project 01', 'Project 02', 'Project 03'];

export function Interface() {
  const [projectsOpen, setProjectsOpen] = useState(false);
  const projectsRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!projectsOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProjectsOpen(false);
        toggleRef.current?.focus();
      }
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !projectsRef.current?.contains(event.target)) {
        setProjectsOpen(false);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [projectsOpen]);

  return (
    <div className="interface">
      <div className="interface-stack">
        <div className="interface-hero">
          <h1 className="identity">MUSTAFA ALI</h1>
          <p className="identity-subtitle">Student @ University of Illinois at Urbana Champaign</p>
          <a className="chapter" href="mailto:mali207@illinois.edu">mali207@illinois.edu</a>
        </div>
        <div className="projects-control" ref={projectsRef}>
          <div className={`projects-panel${projectsOpen ? ' is-open' : ''}`} id="projects-panel" role="region" aria-label="Projects" aria-hidden={!projectsOpen}>
            <p className="projects-panel-heading">Selected work <span>Coming soon</span></p>
            {projects.map((project, index) => (
              <a
                className="project-link"
                href="#"
                key={project}
                tabIndex={projectsOpen ? 0 : -1}
                aria-disabled="true"
                onClick={(event) => event.preventDefault()}
              >
                <span className="project-number">0{index + 1}</span>
                <span>{project}</span>
                <span className="project-link-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <button
            className="projects-toggle"
            type="button"
            ref={toggleRef}
            aria-controls="projects-panel"
            aria-expanded={projectsOpen}
            onClick={() => setProjectsOpen((open) => !open)}
          >
            <span>View Projects</span>
            <span className="projects-toggle-icon" aria-hidden="true">{projectsOpen ? '−' : '+'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
