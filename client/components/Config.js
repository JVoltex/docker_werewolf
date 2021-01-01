function Config() {
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
            className="notification is-black has-text-centered"
            style={{ border: "3px solid" }}
          >
            <p>役職</p>
            <hr />
            <div style={{ maxHeight: "500px", overflow: "auto" }}>
              <p>人狼</p>
              <p>占い師</p>
              <p>狩人</p>
              <p>霊媒師</p>
            </div>
            <div className="button is-black" style={{ border: "3px solid" }}>
              ▶けってい
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Config;
