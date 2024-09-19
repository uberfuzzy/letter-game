// src/WebSocketClient.tsx

interface WebSocketClientProps {
  status: string;
  statusText: string;
}

const WebSocketClient = (props: WebSocketClientProps) => {
  const { status, statusText } = props;

  return (
    <div className='websocket'>
      <span className='wss_icon' title={statusText}>{status}</span>
    </div>
  );
};

export default WebSocketClient;
