# VoiceFit Backend Testing Suite

Comprehensive automated testing for all backend services and endpoints.

---

## 📋 **Test Coverage**

### **Phase 1: Service Unit Tests** (5 tests)
- ✅ `test_weather_service.py` - Weather API & impact analysis (5 tests)
- ✅ `test_gap_calculator.py` - GAP calculation & terrain difficulty (6 tests)
- ✅ `test_volume_tracking.py` - Volume tracking by muscle group (5 tests)
- ✅ `test_fatigue_monitoring.py` - Fatigue assessment & scoring (5 tests)
- ✅ `test_deload_service.py` - Deload recommendations (5 tests)

### **Phase 2: API Endpoint Tests** (5 tests)
- ✅ `test_running_endpoints.py` - Running parse & analyze endpoints (3 tests)
- ✅ `test_workout_insights.py` - Workout insights endpoint (2 tests)
- ✅ `test_program_generation.py` - Program generation endpoints (3 tests)
- ✅ `test_analytics_endpoints.py` - Analytics endpoints (3 tests)
- ✅ `test_ai_coach.py` - AI Coach endpoint (3 tests)

### **Phase 3: Integration Tests** (4 tests)
- ✅ `test_user_seed.py` - User seed data verification (7 tests)
- ✅ `test_user_context_builder.py` - UserContextBuilder with real data (4 tests)
- ✅ `test_full_stack_integration.py` - Complete workout workflow (1 test)
- ✅ `test_running_workflow.py` - Complete running workflow (1 test)

### **Phase 4: Performance Tests** (2 tests)
- ✅ `test_latency.py` - Endpoint latency testing (3 tests)
- ✅ `test_load.py` - Concurrent request load testing (2 tests)

**Total: 16 test files, 57+ individual tests**

---

## 🚀 **Quick Start**

### **Prerequisites**

1. **Backend server running:**
   ```bash
   cd apps/backend
   uvicorn main:app --reload
   ```

2. **Environment variables set:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `OPENWEATHER_API_KEY`
   - `OPENAI_API_KEY`
   - `UPSTASH_VECTOR_URL`
   - `UPSTASH_VECTOR_TOKEN`

3. **Test user exists in database:**
   - User ID: `test-user-voicefit-001`
   - Should have 45 days of workout data

---

## 🧪 **Running Tests**

### **Option 1: Run All Tests (Recommended)**

```bash
cd apps/backend
python run_all_tests.py
```

This will execute all 16 test files in the proper order and generate a comprehensive report.

**Estimated Time:** 2-3 hours (includes AI endpoint tests)

---

### **Option 2: Run Individual Test Files**

```bash
cd apps/backend

# Service Unit Tests
python test_weather_service.py
python test_gap_calculator.py
python test_volume_tracking.py
python test_fatigue_monitoring.py
python test_deload_service.py

# Endpoint Tests
python test_running_endpoints.py
python test_workout_insights.py
python test_program_generation.py
python test_analytics_endpoints.py
python test_ai_coach.py

# Integration Tests
python test_user_seed.py
python test_user_context_builder.py
python test_full_stack_integration.py
python test_running_workflow.py

# Performance Tests
python test_latency.py
python test_load.py
```

---

### **Option 3: Run by Phase**

```bash
cd apps/backend

# Phase 1: Service Unit Tests (30 min)
python test_weather_service.py
python test_gap_calculator.py
python test_volume_tracking.py
python test_fatigue_monitoring.py
python test_deload_service.py

# Phase 2: Endpoint Tests (45 min)
python test_running_endpoints.py
python test_workout_insights.py
python test_program_generation.py
python test_analytics_endpoints.py
python test_ai_coach.py

# Phase 3: Integration Tests (30 min)
python test_user_seed.py
python test_user_context_builder.py
python test_full_stack_integration.py
python test_running_workflow.py

# Phase 4: Performance Tests (15 min)
python test_latency.py
python test_load.py
```

---

## 📊 **Test Output**

Each test file produces detailed output:

```
================================================================================
WEATHER SERVICE TEST SUITE
================================================================================

================================================================================
TEST 1: Weather API Connection
================================================================================
✅ WeatherService initialized successfully
   Provider: openweathermap
   API Key: 73f2b83868...

================================================================================
TEST 2: Current Weather Fetching
================================================================================

📍 Fetching current weather for San Francisco (37.7749, -122.4194)...

✅ Current Weather Data:
   Temperature: 62.5°F
   Humidity: 75%
   Wind Speed: 8.5 mph
   Conditions: Clear

✅ All validations passed

================================================================================
TEST SUMMARY
================================================================================
✅ PASS: Weather API Connection
✅ PASS: Current Weather Fetching
✅ PASS: Historical Weather Fetching
✅ PASS: Weather Impact Analysis
✅ PASS: Error Handling

Total: 5/5 tests passed (100.0%)

🎉 All tests passed!
```

---

## 🎯 **Success Criteria**

### **Service Unit Tests**
- ✅ All services initialize without errors
- ✅ Calculations are mathematically correct
- ✅ Error handling works properly
- ✅ Empty data handled gracefully

### **Endpoint Tests**
- ✅ All endpoints return 200 status code
- ✅ Response structure matches expected schema
- ✅ Data is saved to database correctly
- ✅ AI responses are relevant and accurate

### **Integration Tests**
- ✅ Test user data exists in database
- ✅ UserContextBuilder fetches all data
- ✅ Complete workflows execute end-to-end
- ✅ No errors or exceptions

### **Performance Tests**
- ✅ Analytics endpoints: < 1s latency
- ✅ AI endpoints: < 3s latency
- ✅ Running endpoints: < 2s latency
- ✅ 80%+ success rate under load

---

## 🐛 **Troubleshooting**

### **Test Fails: "Connection refused"**
- **Solution:** Make sure backend server is running on `http://localhost:8000`

### **Test Fails: "User not found"**
- **Solution:** Run the user seed script to create test user data

### **Test Fails: "Weather API error"**
- **Solution:** Check that `OPENWEATHER_API_KEY` is set correctly

### **Test Fails: "Supabase error"**
- **Solution:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct

### **Test Fails: "Timeout"**
- **Solution:** AI endpoints may take longer. Increase timeout or check API keys

---

## 📝 **Test Maintenance**

### **Adding New Tests**

1. Create new test file: `test_new_feature.py`
2. Follow the existing test structure:
   ```python
   def test_feature():
       print("\n" + "="*80)
       print("TEST 1: Feature Name")
       print("="*80)
       
       try:
           # Test code here
           assert condition
           print("\n✅ All validations passed")
           return True
       except Exception as e:
           print(f"\n❌ Test failed: {e}")
           return False
   
   def run_all_tests():
       tests = [("Feature Name", test_feature)]
       # ... rest of boilerplate
   ```

3. Add to `run_all_tests.py` in appropriate phase

### **Updating Existing Tests**

- Keep test names descriptive
- Add comments for complex logic
- Update assertions when API changes
- Maintain consistent output format

---

## 📈 **Test Metrics**

After running all tests, you'll see:

```
================================================================================
OVERALL STATISTICS
================================================================================

Total Tests: 57
  ✅ Passed:  55 (96.5%)
  ❌ Failed:  2 (3.5%)
  ⚠️  Skipped: 0 (0.0%)

Total Duration: 125.34s (2.1 minutes)
Started:  2024-01-15 10:30:00
Finished: 2024-01-15 10:32:05

================================================================================
🎉 ALL TESTS PASSED!
================================================================================
```

---

## 🔄 **CI/CD Integration**

To integrate with CI/CD:

```yaml
# .github/workflows/backend-tests.yml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd apps/backend
          pip install -r requirements.txt
      
      - name: Run tests
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          OPENWEATHER_API_KEY: ${{ secrets.OPENWEATHER_API_KEY }}
        run: |
          cd apps/backend
          python run_all_tests.py
```

---

## 📚 **Additional Resources**

- **Backend Testing Plan:** `BACKEND_TESTING_PLAN.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **User Seed Script:** `seed_test_user.py`

---

## ✅ **Next Steps**

1. **Run all tests:** `python run_all_tests.py`
2. **Fix any failing tests**
3. **Document any issues found**
4. **Update API documentation if needed**
5. **Prepare for mobile testing** (when available)

---

**Happy Testing! 🚀**

