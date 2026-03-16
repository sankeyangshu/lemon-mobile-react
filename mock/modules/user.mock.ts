import { defineMock } from 'vite-plugin-mock-dev-server';
import { resultError, resultSuccess } from '../utils';

interface userType {
  id: number;
  username: string;
  password: string;
  nickname: string;
  avatar: string;
  sign?: string;
  token: string;
}

const mockExample = [
  '水光潋滟晴方好，山色空蒙雨亦奇。',
  '春江潮水连海平，海上明月共潮生。',
  '山回路转不见君，雪上空留马行处。',
  '春风又绿江南岸，明月何时照我还。',
  '人生自古谁无死，留取丹心照汗青。',
  '人生得意须尽欢，莫使金樽空对月。',
  '天生我材必有用，千金散尽还复来。',
  '日暮乡关何处是，烟波江上使人愁。',
];

const mockUsers: userType[] = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    nickname: '三棵杨树',
    avatar: 'https://avatars.githubusercontent.com/u/64878070?v=4',
    sign: '从来没有真正的绝境，只有心灵的迷途',
    token: 'adminToken',
  },
  {
    id: 2,
    username: 'test',
    password: '123456',
    nickname: '测试账号',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    sign: '水光潋滟晴方好，山色空蒙雨亦奇',
    token: 'testToken',
  },
  {
    id: 3,
    username: 'guest',
    password: '123456',
    nickname: '访客',
    avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
    token: 'guestToken',
  },
];

export default defineMock([
  {
    url: '/api/example',
    method: 'GET',
    delay: 500,
    body: () => {
      const rand = Math.floor(Math.random() * mockExample.length);
      const mockData = mockExample[rand];
      return resultSuccess({ content: mockData, date: Date.now() });
    },
  },
  {
    url: '/api/auth/login',
    method: 'POST',
    delay: 500,
    body: ({ body }) => {
      const { username, password } = body;
      const userData = mockUsers.find(
        (item) => item.username === username && item.password === password,
      );
      if (!userData) {
        return resultError('帐号或密码不正确');
      }

      const { token, ...rest } = userData;
      return resultSuccess({
        user: rest,
        token,
      });
    },
  },
]);
