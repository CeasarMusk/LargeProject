import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool isLogin = true;
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  String? errorMessage;
  String? successMessage;
  bool loading = false;

  void toggleForm() {
    setState(() {
      isLogin = !isLogin;
      errorMessage = null;
      successMessage = null;
      emailController.clear();
      passwordController.clear();
    });
  }

  Future<void> handleSubmit() async {
    setState(() {
      loading = true;
      errorMessage = null;
      successMessage = null;
    });

    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        errorMessage = "Please fill in all fields";
        loading = false;
      });
      return;
    }

    if (password.length < 6) {
      setState(() {
        errorMessage = "Password must be at least 6 characters";
        loading = false;
      });
      return;
    }

    try {
      if (isLogin) {
        final result = await ApiService.login(email, password);
        if (result["success"] == true) {
          if (context.mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => DashboardScreen(email: email),
              ),
            );
          }
        }
      } else {
        final result = await ApiService.register(email, password);
        if (result["success"] == true) {
          setState(() => successMessage = "Account created! You can login now.");
          Future.delayed(const Duration(seconds: 2), toggleForm);
        }
      }
    } catch (e) {
      setState(() => errorMessage = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text("Budget Buddy"),
        backgroundColor: Colors.green[700],
        centerTitle: true,
      ),
      body: Center(
        child: Card(
          elevation: 3,
          margin: const EdgeInsets.all(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(isLogin ? "Login" : "Register",
                    style: const TextStyle(fontSize: 22)),
                const SizedBox(height: 20),
                if (errorMessage != null)
                  Text(errorMessage!,
                      style: const TextStyle(color: Colors.red)),
                if (successMessage != null)
                  Text(successMessage!,
                      style: const TextStyle(color: Colors.green)),
                const SizedBox(height: 10),
                TextField(
                  controller: emailController,
                  decoration: const InputDecoration(labelText: "Email"),
                ),
                TextField(
                  controller: passwordController,
                  decoration: const InputDecoration(labelText: "Password"),
                  obscureText: true,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: loading ? null : handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green[700],
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  child: Text(
                    loading
                        ? "Working..."
                        : isLogin
                            ? "Login"
                            : "Register",
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                TextButton(
                  onPressed: loading ? null : toggleForm,
                  child: Text(isLogin
                      ? "Create an account"
                      : "Already have an account? Login"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
