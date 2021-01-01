import Input from "./Input";

function Welcome() {
  return (
    <div className="columns is-vcentered">
      <div className="column is-8">
        <div className="notification is-black">
          <p>村長「はるばるとようこそ。</p>
          <p>村長「まずは名前を聞かせておくれ。</p>
        </div>
      </div>
      <div className="column">
        <div className="field has-addons">
          <Input prompt="名前" button="けってい" />
        </div>
      </div>
    </div>
  );
}
export default Welcome;
