function Game() {
  return (
    <>
      <div className="columns">
        <div className="column">
          <div
            className="notification is-black"
            style={{ border: "3px solid" }}
          >
            <p>メンバー</p>
            <hr />
            <div style={{ maxHeight: "500px", overflow: "auto" }}>
              <p>占い師</p>
              <p>狩人</p>
              <p>霊媒師</p>
            </div>
          </div>
        </div>
        <div className="column">
          <div
            className="notification is-black"
            style={{ border: "3px solid" }}
          >
            <p>チャット</p>
            <hr />
            <div style={{ maxHeight: "500px", overflow: "auto" }}>
              <p>村長「あーあ、つまらんの</p>
              <p>『いやっほー</p>
            </div>
            <div className="field has-addons mt-3">
              <div className="control">
                <input className="input" placeholder="名前"></input>
              </div>
              <div className="control">
                <button
                  className="button is-black"
                  style={{ border: "3px solid" }}
                >
                  ▶おくる
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Game;
