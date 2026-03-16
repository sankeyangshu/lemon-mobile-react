import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import NavBar from '@/components/custom/nav-bar';
import SvgIcon from '@/components/custom/svg-icon';
import PasswordInput from './-components/password-input';

export const Route = createFileRoute('/(auth)/forgot-password')({
  staticData: {
    title: '忘记密码',
    i18nKey: 'router.forgotPassword',
  },
  component: RouteComponent,
});

const PHONE_REG = /^(?:13\d|14[014-9]|15[0-35-9]|16[2567]|17[0-8]|18\d|19[0-35-9])\d{8}$/;

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);

  /**
   * 判断是否是合法手机号
   */
  const validPhone = (phone: string) => {
    return PHONE_REG.test(phone);
  };

  const formSchema = z.object({
    phone: z.string()
      .min(1, { message: t('login.pleaseEnterPhone') })
      .refine(validPhone, { message: t('login.pleaseEnterValidPhone') }),
    code: z.string().min(1, { message: t('login.pleaseEnterVerificationCode') }),
    password: z.string().min(1, { message: t('login.pleaseEnterNewPassword') }),
    confirmPassword: z.string().min(1, { message: t('login.pleaseEnterNewPasswordAgain') }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('login.passwordInconsistent'),
    path: ['confirmPassword'],
  });

  type FormData = z.infer<typeof formSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      phone: '',
      code: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = (_data) => {
    // eslint-disable-next-line no-console
    console.log('重置密码数据', _data);
  };

  const handleGetCode = () => {
    if (countdown > 0)
      return;

    // TODO: 发送验证码
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="box-border flex size-full flex-col items-center p-5">
      <NavBar
        title={t('router.forgotPassword')}
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
              type="tel"
              placeholder={t('login.pleaseEnterPhone')}
              className={`
                flex-1 bg-transparent text-base
                focus:outline-none
              `}
              {...register('phone')}
            />
          </label>
          {errors.phone && (
            <p className="mt-2 text-xs text-error">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label className={`
            box-border flex h-12.5 w-full items-center gap-2 rounded-2xl bg-white px-4 py-3
            dark:bg-[#1f1f1f]
          `}
          >
            <input
              type="tel"
              placeholder={t('login.pleaseEnterVerificationCode')}
              className={`
                flex-1 bg-transparent text-base
                focus:outline-none
              `}
              {...register('code')}
            />
            <button
              type="button"
              className="btn h-8 min-h-8 btn-sm btn-primary"
              disabled={countdown > 0}
              onClick={handleGetCode}
            >
              {countdown > 0 ? `${countdown}s` : t('login.code')}
            </button>
          </label>
          {errors.code && (
            <p className="mt-2 text-xs text-error">
              {errors.code.message}
            </p>
          )}
        </div>

        <PasswordInput
          placeholder={t('login.pleaseEnterNewPassword')}
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          placeholder={t('login.pleaseEnterNewPasswordAgain')}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          className="btn w-full btn-primary"
        >
          {t('login.confirmReset')}
        </button>
      </form>
    </div>
  );
}
