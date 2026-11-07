import { useState } from 'react';

const strides = [
  "       .-\"\"\"-.\n      /  .--. \\\n      |  | o  >\n      \\  |  v/\n       '---\\_/\n       .--| |-.\n     .[__]/T\\  \\\n     |[__]| |\\  o\n     '----|_| '--'\n          / \\\\\n        _/   \\_\n       (__)  (__)",
  '       .-"""-.\n      /  .--. \\\n      |  | o  >\n      \\  |  v/\n       \'---\\_/\n       .--| |-.\n     .[__]/T\\|\n     |[__]| |\\o\n     \'----|_|\n          | \\\\\n          | _\\\n         (_(__)',
  '       .-"""-.\n      /  .--. \\\n      |  | o  >\n      \\  |  v/\n       \'---\\_/\n       .--| |-.\n     .[__]/T\\\n     |[__]| |\\__o\n     \'----|_|\n          / \\\\\n        _/   \\_\n       (__)  (__)',
  '       .-"""-.\n      /  .--. \\\n      |  | o  >\n      \\  |  v/\n       \'---\\_/\n       .--| |-.\n     .[__]/T\\\n     |[__]|o|\n     \'----|_|\n          /|\n        _/ |_\n       (__)__)'
];

export default function AsciiWalker() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="ascii-walk" data-paused={paused}>
      <div className="ascii-walk-track" aria-hidden="true">
        <div className="ascii-walk-traveler">
          <span className="ascii-walk-thought">one step closer.</span>
          <div className="ascii-walk-stride">
            {strides.map((stride, index) => (
              <pre key={index} style={{ animationDelay: `${index * 0.18}s` }}>
                {stride}
              </pre>
            ))}
          </div>
        </div>
      </div>
      <div className="ascii-walk-caption">
        <span>A little campus stroll.</span>
        <button
          type="button"
          aria-label={
            paused ? 'Resume walking animation' : 'Pause walking animation'
          }
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? 'Walk on' : 'Take a breather'}
        </button>
      </div>
    </div>
  );
}
