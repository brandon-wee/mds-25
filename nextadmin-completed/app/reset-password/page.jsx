import ResetPasswordForm from "../ui/reset-password/resetPasswordForm/resetPasswordForm";
import styles from "../ui/login/login.module.css";

const ResetPasswordPage = () => {
  return (
    <div className={styles.container}>
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPasswordPage;
