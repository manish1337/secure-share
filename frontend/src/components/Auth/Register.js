import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  CircularProgress,
} from "@material-ui/core";
import { register } from "../../redux/slices/authSlice";

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (values) => {
    const result = await dispatch(register(values));
    if (!result.error) {
      navigate("/login");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Register
        </Typography>
        <Formik
          initialValues={{
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, touched, errors }) => (
            <Form>
              <TextField
                fullWidth
                margin="normal"
                name="username"
                label="Username"
                value={values.username}
                onChange={handleChange}
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
              />
              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Email"
                type="email"
                value={values.email}
                onChange={handleChange}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={handleChange}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
              <TextField
                fullWidth
                margin="normal"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                error={
                  touched.confirmPassword && Boolean(errors.confirmPassword)
                }
                helperText={touched.confirmPassword && errors.confirmPassword}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                style={{ marginTop: "1rem" }}
              >
                {loading ? <CircularProgress size={24} /> : "Register"}
              </Button>

              {error && (
                <Typography
                  color="error"
                  align="center"
                  style={{ marginTop: "1rem" }}
                >
                  {error}
                </Typography>
              )}

              <Box mt={2} textAlign="center">
                <Typography variant="body2">
                  Already have an account?{" "}
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    Login here
                  </Link>
                </Typography>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default Register;
