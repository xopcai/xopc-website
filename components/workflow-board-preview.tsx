import type { Messages } from "@/lib/i18n/messages";

type BoardCopy = Messages["landing"]["workflows"]["board"];

type Props = {
  board: BoardCopy;
};

function statusClass(status: BoardCopy["columns"][number]["cards"][number]["status"]): string {
  return `wf-board-card-status wf-board-card-status--${status}`;
}

export function WorkflowBoardPreview({ board }: Props) {
  return (
    <div className="wf-board-shell" role="img" aria-label={board.ariaLabel}>
      <div className="wf-board-shell-header">
        <div className="code-dot red" aria-hidden />
        <div className="code-dot yellow" aria-hidden />
        <div className="code-dot green" aria-hidden />
        <span className="wf-board-shell-title">{board.windowTitle}</span>
        <span className="wf-board-shell-route">#/workflows</span>
      </div>

      <div className="wf-board-scene">
        <div className="wf-board-scene-label">{board.sceneLabel}</div>
        <div className="wf-board-scene-hint">{board.sceneHint}</div>
      </div>

      <div className="wf-board-columns">
        {board.columns.map((column) => (
          <div className="wf-board-column" key={column.id}>
            <div className="wf-board-column-head">
              <span className="wf-board-column-title">{column.label}</span>
              <span className="wf-board-column-count">{column.count}</span>
            </div>
            <div className="wf-board-column-cards">
              {column.cards.map((card) => (
                <div
                  className={`wf-board-card${card.featured ? " wf-board-card--featured" : ""}`}
                  key={`${column.id}-${card.title}`}
                >
                  <div className="wf-board-card-top">
                    <span className="wf-board-card-name">{card.title}</span>
                    <span className={statusClass(card.status)} aria-hidden />
                  </div>
                  <p className="wf-board-card-meta">{card.meta}</p>
                  {"progress" in card && card.progress ? (
                    <div className="wf-board-card-progress">
                      <div className="wf-board-card-progress-bar" style={{ width: card.progress }} />
                    </div>
                  ) : null}
                  {"detail" in card && card.detail ? <p className="wf-board-card-detail">{card.detail}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
