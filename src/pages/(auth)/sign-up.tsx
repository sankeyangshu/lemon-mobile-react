import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import NavBar from '@/components/custom/nav-bar';
import SvgIcon from '@/components/custom/svg-icon';
import Toast from '@/components/custom/toast';
import PasswordInput from './-components/password-input';

export const Route = createFileRoute('/(auth)/sign-up')({
  staticData: {
    title: '注册',
    i18nKey: 'router.register',
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAgreeLicense, setIsAgreeLicense] = useState(false);

  const formSchema = z.object({
    username: z.string().min(1, { message: t('login.usernameError') }),
    password: z.string().min(1, { message: t('login.passwordError') }),
    confirmPassword: z.string().min(1, { message: t('login.againEnterPassword') }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('login.passwordInconsistent'),
    path: ['confirmPassword'],
  });

  type FormData = z.infer<typeof formSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = (_data) => {
    if (!isAgreeLicense) {
      Toast.fail('请先阅读并同意用户协议和隐私政策');
    }
  };

  return (
    <div className="box-border flex size-full flex-col items-center p-5">
      <NavBar
        title={t('router.register')}
        fixed
        placeholder
        leftArrow={(
          <SvgIcon className="text-2xl" icon="mdi:chevron-left" />
        )}
        onClickLeft={() => router.history.back()}
      />
      <div className="mt-5 mb-7.5">
        <SvgIcon className="size-25!" localIcon="icon-logo" />
      </div>

      <form className="grid w-full gap-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={`
            box-border flex h-12.5 w-full rounded-2xl bg-white px-4 py-3
            dark:bg-[#1f1f1f]
          `}
          >
            <input
              type="text"
              placeholder={t('login.username')}
              className={`
                flex-1 bg-transparent text-base
                focus:outline-none
              `}
              {...register('username')}
            />
          </label>
          {errors.username && (
            <p className="mt-2 text-xs text-error">
              {errors.username.message}
            </p>
          )}
        </div>

        <PasswordInput
          placeholder={t('login.password')}
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          placeholder={t('login.againEnterPassword')}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          className="btn w-full btn-primary"
        >
          {t('login.register')}
        </button>
      </form>

      <div className={`
        fixed inset-x-5 bottom-10 mx-5 flex h-5 items-center justify-center text-sm/5
      `}
      >
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="checkbox mr-2 shrink-0 checkbox-primary"
            checked={isAgreeLicense}
            onChange={(e) => setIsAgreeLicense(e.target.checked)}
          />
          <span>
            {t('login.readAgreement')}
            <a
              href="https://sankeyangshu.top"
              target="_blank"
              rel="noreferrer"
              className="text-primary"
            >
              {t('login.privacyPolicy')}
            </a>
            {t('login.and')}
            <a
              href="https://sankeyangshu.top"
              target="_blank"
              rel="noreferrer"
              className="text-primary"
            >
              {t('login.userAgreement')}
            </a>
          </span>
        </label>
      </div>
    </div>
  );
}
