import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  final String email;

  const DashboardScreen({Key? key, required this.email}) : super(key: key);

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Map<String, dynamic>> transactions = [];
  bool loading = true;
  
  final TextEditingController titleController = TextEditingController();
  final TextEditingController amountController = TextEditingController();

  @override
  void initState() {
    super.initState();
    fetchTransactions();
  }

  @override
  void dispose() {
    titleController.dispose();
    amountController.dispose();
    super.dispose();
  }

  Future<void> fetchTransactions() async {
    try {
      final result = await ApiService.getTransactions(widget.email);
      
      if (result['success'] == true && result['transactions'] != null) {
        final fetchedTransactions = List<Map<String, dynamic>>.from(result['transactions']);
        
        // If no transactions exist, add demo data
        if (fetchedTransactions.isEmpty) {
          await addDemoTransactions();
        } else {
          setState(() {
            transactions = fetchedTransactions;
            loading = false;
          });
        }
      } else {
        setState(() {
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        loading = false;
      });
      print('Error fetching transactions: $e');
    }
  }

  Future<void> addDemoTransactions() async {
    final demoTransactions = [
      {'title': 'Paycheck', 'amount': 1000.0},
      {'title': 'Groceries', 'amount': -50.0},
      {'title': 'Gas', 'amount': -40.0},
    ];

    try {
      for (var demo in demoTransactions) {
        await ApiService.addTransaction(
          widget.email,
          demo['title'] as String,
          demo['amount'] as double,
          DateTime.now().toIso8601String(),
        );
      }
      
      // Fetch the newly added transactions
      final result = await ApiService.getTransactions(widget.email);
      if (result['success'] == true && result['transactions'] != null) {
        setState(() {
          transactions = List<Map<String, dynamic>>.from(result['transactions']);
          loading = false;
        });
      }
    } catch (e) {
      print('Error adding demo transactions: $e');
      setState(() {
        loading = false;
      });
    }
  }

  Future<void> addTransaction() async {
    final title = titleController.text.trim();
    final amountText = amountController.text.trim();

    if (title.isEmpty || amountText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    final amount = double.tryParse(amountText);
    if (amount == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid number')),
      );
      return;
    }

    try {
      setState(() => loading = true);
      
      final result = await ApiService.addTransaction(
        widget.email,
        title,
        amount,
        DateTime.now().toIso8601String(),
      );

      if (result['success'] == true) {
        titleController.clear();
        amountController.clear();
        await fetchTransactions();
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Transaction added!')),
          );
        }
      }
    } catch (e) {
      setState(() => loading = false);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  double calculateTotal() {
    return transactions.fold<double>(0.0, (sum, item) {
      final amount = item['amount'];
      if (amount is int) {
        return sum + amount.toDouble();
      } else if (amount is double) {
        return sum + amount;
      } else if (amount is num) {
        return sum + amount.toDouble();
      }
      return sum;
    });
  }

  @override
  Widget build(BuildContext context) {
    final total = calculateTotal();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Budget Buddy Dashboard'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        centerTitle: true,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Transaction Title Input
                  TextField(
                    controller: titleController,
                    decoration: InputDecoration(
                      hintText: 'Transaction title',
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Amount Input
                  TextField(
                    controller: amountController,
                    decoration: InputDecoration(
                      hintText: 'Amount',
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                      signed: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Add Transaction Button
                  ElevatedButton(
                    onPressed: addTransaction,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Add Transaction',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Recent Transactions Header
                  const Text(
                    'Recent Transactions',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Transactions List
                  ...transactions.map((transaction) {
                    double amount = 0.0;
                    final amountValue = transaction['amount'];
                    if (amountValue is int) {
                      amount = amountValue.toDouble();
                    } else if (amountValue is double) {
                      amount = amountValue;
                    } else if (amountValue is num) {
                      amount = amountValue.toDouble();
                    }
                    
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            transaction['title'] ?? 'Unknown',
                            style: const TextStyle(fontSize: 16),
                          ),
                          Text(
                            '${amount >= 0 ? '+' : ''}${amount.toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: amount >= 0 ? Colors.green : Colors.red,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  
                  const SizedBox(height: 24),
                  
                  // Total Balance Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.lightBlue[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Total Balance:',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '\$${total.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}