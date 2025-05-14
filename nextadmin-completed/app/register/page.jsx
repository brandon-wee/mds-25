import RegisterForm from "../ui/register/registerForm/registerForm";
import styles from "../ui/login/login.module.css";

const RegisterPage = () => {
  return (
    <div className={styles.container}>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
