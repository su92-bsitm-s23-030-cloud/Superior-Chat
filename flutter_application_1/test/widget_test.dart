import 'package:flutter_application_1/screens/splash_screen.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_1/main.dart';

void main() {
  testWidgets('App starts with splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const SuperiorMessenger());
    expect(find.byType(SplashScreen), findsOneWidget);
  });
}