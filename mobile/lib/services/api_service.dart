import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = "http://64.225.25.63:5000/api";

  static Future<Map<String, dynamic>> safeRequest(
      String endpoint, String method,
      {Map<String, dynamic>? body}) async {
    final uri = Uri.parse("$baseUrl$endpoint");
    http.Response response;

    if (method == "GET") {
      response = await http.get(uri);
    } else {
      response = await http.post(
        uri,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(body),
      );
    }

    Map<String, dynamic> data;
    try {
      data = jsonDecode(response.body);
    } catch (_) {
      data = {"success": false, "message": "Invalid response from server"};
    }

    if (response.statusCode != 200 || data["success"] == false) {
      throw Exception(data["message"] ?? "Request failed (${response.statusCode})");
    }

    return data;
  }

  static Future<Map<String, dynamic>> login(String email, String password) {
    return safeRequest("/login", "POST", body: {"email": email, "password": password});
  }

  static Future<Map<String, dynamic>> register(String email, String password) {
    return safeRequest("/register", "POST", body: {"email": email, "password": password});
  }

  static Future<Map<String, dynamic>> getTransactions(String email) {
    return safeRequest("/transactions?email=$email", "GET");
  }

  static Future<Map<String, dynamic>> addTransaction(
      String email, String title, double amount, String date) {
    return safeRequest("/transactions", "POST",
        body: {"userEmail": email, "title": title, "amount": amount, "date": date});
  }
}
