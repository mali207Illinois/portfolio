interface InterfaceProps {
  mobile: boolean;
}

export function Interface({ mobile }: InterfaceProps) {
  return (
    <div className="interface">
      <div className="interface-header">
        <h1 className="identity">MUSTAFA ALI</h1>
        <span className="chapter">mali207@illinois.edu</span>
      </div>
      <div className="interface-footer">
        {!mobile && <p className="instruction">drag to inspect</p>}
        <p className="instruction instruction-enter">scroll to enter</p>
      </div>
    </div>
  );
}
