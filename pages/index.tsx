import { nanoid } from 'nanoid';
import type { NextPage } from 'next';
import { SetStateAction, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
interface Msg {
  peo: 'you' | 'me';
  msg: string;
  id: string;
}
let messsage = new Map<string, Msg[]>();
const Msgs = ({
  msg,
  talkTo,
  setMessage,
}: {
  talkTo: string;
  msg: Msg[];
  setMessage: React.Dispatch<SetStateAction<Msg[]>>;
}) => {
  const sendMsg = (msg: string, id: string) => {
    socket.emit('private message', id, msg);
    if (messsage.has(id)) {
      messsage.set(id, [
        ...messsage.get(id)!.concat({ peo: 'me', msg, id: nanoid() }),
      ]);
    } else {
      messsage.set(id, [{ peo: 'me', msg, id: nanoid() }]);
    }
    setMessage(messsage.get(id)!);
  };
  const [msgs, setMsgs] = useState<string>('');
  return (
    <div
      className="relative flex  w-10/12 flex-col self-end"
      style={{ height: '95vh' }}
    >
      <div className="inline-block h-screen overflow-auto">
        {msg.map((m) => (
          <MM key={m.id} peo={m.peo} id={m.id} msg={m.msg} />
        ))}
      </div>
      <textarea
        value={msgs}
        onChange={(e) => setMsgs(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            sendMsg(msgs, talkTo);
            setMsgs('');
          }
        }}
        className="h-40 rounded-sm border-2 border-gray-300 focus:outline-none"
      />
      <button
        className="absolute right-4 bottom-3 border border-sky-300 bg-sky-300 px-2"
        onClick={() => {
          sendMsg(msgs, talkTo);
          setMsgs('');
        }}
      >
        send
      </button>
    </div>
  );
};
const MM = ({
  id,
  peo,
  msg,
}: {
  id: string;
  peo: 'you' | 'me';
  msg: string;
}) => {
  return (
    <div
      className={`flex w-full ${
        peo == 'you' ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      <span
        style={{ minWidth: '3rem' }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-300"
      >
        {id[0].toUpperCase()}
      </span>
      <span className="m-1 max-w-md rounded-md bg-gray-200 p-1">{msg}</span>
    </div>
  );
};
const Home: NextPage = () => {
  const [msg, setMsg] = useState<Msg[]>([]);
  const [talkTo, setTalkTo] = useState<string>('');
  const [id, setId] = useState<string>('');
  useEffect(() => {
    socket.on('connect', () => {
      console.log('connected', socket.id);
      setId(socket.id);
    });
    socket.emit('get all');
    socket.on('all', (users) => {
      setUsers(users);
    });
    socket.on('private message', (id, msg) => {
      console.log(id, msg);
      if (messsage.has(id)) {
        messsage.set(id, [
          ...messsage.get(id)!.concat({ peo: 'you', msg, id: nanoid() }),
        ]);
      } else {
        messsage.set(id, [{ peo: 'you', msg, id: nanoid() }]);
      }
      setMsg(messsage.get(id)!);
      setTalkTo(id);
      console.log(messsage);
    });
    socket.onAny((event, ...args) => {
      console.log(`event: ${event} | arguments: ${args}`);
    });
    return () => {
      socket.off('all');
      socket.offAny();
      socket.off('private message');
      socket.off('connect');
    };
  }, []);
  const [users, setUsers] = useState<string[]>([]);

  return (
    <>
      <header className="text-center">
        {talkTo == ''
          ? `选择好友开始聊天吧` + `\n你的id是${id}`
          : talkTo + `\n你的id是${id}`}
      </header>
      <div
        className="flex  flex-row justify-center overflow-auto"
        style={{ maxHeight: '95vh' }}
      >
        <div className="m-0 w-24 overflow-y-auto" style={{ minHeight: '95vh' }}>
          {users.map((item) => (
            <div
              onClick={() => {
                setMsg(messsage.get(item) || []);
                setTalkTo(item);
                console.log(item);
              }}
              key={item}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-pink-300"
            >
              {item[0].toUpperCase()}
            </div>
          ))}{' '}
          <div></div>
        </div>
        <Msgs setMessage={setMsg} talkTo={talkTo} msg={msg} />
      </div>
    </>
  );
};

export default Home;
