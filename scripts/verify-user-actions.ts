import { DatabaseService } from '../src/utils/DatabaseService';
import { Logger } from '../src/utils/Logger';
import { userService } from '../src/services/users/_data/userService';
import type { ServerCtxType } from '../src/lib/utils/types';

const logger = new Logger('ACTION-VERIFICATION');

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  input: any;
  output?: any;
  error?: string;
  duration: number;
}

class ActionVerification {
  private db = DatabaseService.getInstance();
  private results: TestResult[] = [];
  private testUserId: string = '';
  private testEmail: string = '';
  private svc: any;

  private buildContext(database?: any): ServerCtxType {
    return {
      accountUserId: 1,
      userRole: 'admin',
      database,
    };
  }

  async run() {
    console.clear();
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║        🧪 USER SERVICE ACTIONS - VERIFICATION SUITE 🧪         ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    try {
      logger.info('\n📡 Connecting to database...');
      await this.db.connect();
      logger.info('✅ Connected to database\n');

      this.testEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      
      // Initialize service with context
      const ctx = this.buildContext();
      this.svc = userService(ctx);

      // Run all tests
      await this.testCreateUser();
      await this.testGetUserById();
      await this.testGetAllUsers();
      await this.testUpdateUser();
      await this.testSearchUsers();
      await this.testDeleteUser();

      // Print summary
      this.printSummary();

    } catch (error) {
      logger.error(`\n❌ Verification failed: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        logger.error(`Stack: ${error.stack}`);
      }
    } finally {
      await this.db.disconnect();
      logger.info('\n✅ Database disconnected\n');
    }
  }

  private async testCreateUser() {
    const startTime = Date.now();
    const testName = 'TEST 1: CREATE USER';
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const input = {
        email: this.testEmail,
        name: 'Test User',
      };

      console.log(`Input: ${JSON.stringify(input, null, 2)}`);
      const result = await this.svc.createUser(input);
      
      const duration = Date.now() - startTime;

      // Validate response
      if (!result || !result.id) {
        throw new Error('Response missing expected data');
      }

      this.testUserId = result.id;

      console.log(`\n✅ PASS (${duration}ms)`);
      console.log(`Output: ${JSON.stringify(result, null, 2)}`);

      this.results.push({
        name: testName,
        status: 'PASS',
        input,
        output: result,
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.log(`\n❌ FAIL (${duration}ms)`);
      console.log(`Error: ${errorMsg}`);

      this.results.push({
        name: testName,
        status: 'FAIL',
        input: {},
        error: errorMsg,
        duration,
      });
    }
  }

  private async testGetUserById() {
    const startTime = Date.now();
    const testName = 'TEST 2: GET USER BY ID';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const input = this.testUserId;

      console.log(`Input: "${input}"`);
      const result = await this.svc.getUserById(input);
      
      const duration = Date.now() - startTime;

      // Validate response
      if (!result || result.id !== this.testUserId) {
        throw new Error('Response missing expected user data');
      }

      console.log(`\n✅ PASS (${duration}ms)`);
      console.log(`Output: ${JSON.stringify(result, null, 2)}`);

      this.results.push({
        name: testName,
        status: 'PASS',
        input,
        output: result,
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.log(`\n❌ FAIL (${duration}ms)`);
      console.log(`Error: ${errorMsg}`);

      this.results.push({
        name: testName,
        status: 'FAIL',
        input: this.testUserId,
        error: errorMsg,
        duration,
      });
    }
  }

  private async testGetAllUsers() {
    const startTime = Date.now();
    const testName = 'TEST 3: GET ALL USERS (Pagination)';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const input = {
        page: 1,
        limit: 5,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      console.log(`Input: ${JSON.stringify(input, null, 2)}`);
      const result = await this.svc.getAllUsers(input);
      
      const duration = Date.now() - startTime;

      // Validate response
      if (!result || !Array.isArray(result.data)) {
        throw new Error('Response missing expected pagination data');
      }

      console.log(`\n✅ PASS (${duration}ms)`);
      console.log(`Output: ${JSON.stringify({
        ...result,
        data: `[${result.data.length} users]`
      }, null, 2)}`);

      this.results.push({
        name: testName,
        status: 'PASS',
        input,
        output: result,
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.log(`\n❌ FAIL (${duration}ms)`);
      console.log(`Error: ${errorMsg}`);

      this.results.push({
        name: testName,
        status: 'FAIL',
        input: {},
        error: errorMsg,
        duration,
      });
    }
  }

  private async testUpdateUser() {
    const startTime = Date.now();
    const testName = 'TEST 4: UPDATE USER';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const updateData = {
        name: 'Updated Test User',
        isActive: true,
      };

      console.log(`Input: ${JSON.stringify({ id: this.testUserId, ...updateData }, null, 2)}`);
      const result = await this.svc.updateUser(this.testUserId, updateData);
      
      const duration = Date.now() - startTime;

      // Validate response
      if (!result || result.name !== 'Updated Test User') {
        throw new Error('Response missing expected updated data');
      }

      console.log(`\n✅ PASS (${duration}ms)`);
      console.log(`Output: ${JSON.stringify(result, null, 2)}`);

      this.results.push({
        name: testName,
        status: 'PASS',
        input: { id: this.testUserId, ...updateData },
        output: result,
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.log(`\n❌ FAIL (${duration}ms)`);
      console.log(`Error: ${errorMsg}`);

      this.results.push({
        name: testName,
        status: 'FAIL',
        input: { id: this.testUserId },
        error: errorMsg,
        duration,
      });
    }
  }

  private async testSearchUsers() {
    const startTime = Date.now();
    const testName = 'TEST 5: SEARCH USERS';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const input = {
        page: 1,
        limit: 10,
        search: 'Updated',
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      console.log(`Input: ${JSON.stringify(input, null, 2)}`);
      const result = await this.svc.searchUsers(input);
      
      const duration = Date.now() - startTime;

      // Validate response
      if (!result || !Array.isArray(result.data)) {
        throw new Error('Response missing expected search results');
      }

      console.log(`\n✅ PASS (${duration}ms)`);
      console.log(`Output: ${JSON.stringify({
        ...result,
        data: `[${result.data.length} results]`
      }, null, 2)}`);

      this.results.push({
        name: testName,
        status: 'PASS',
        input,
        output: result,
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.log(`\n❌ FAIL (${duration}ms)`);
      console.log(`Error: ${errorMsg}`);

      this.results.push({
        name: testName,
        status: 'FAIL',
        input: {},
        error: errorMsg,
        duration,
      });
    }
  }

  private async testDeleteUser() {
    const startTime = Date.now();
    const testName = 'TEST 6: DELETE USER';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${testName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const input = this.testUserId;

      console.log(`Input: "${input}"`);
      await this.svc.deleteUser(input);
      
      const duration = Date.now() - startTime;

      // Verify deletion by trying to fetch
      const deletedUser = await this.svc.getUserById(input);
      if (deletedUser) {
        throw new Error('User still exists after deletion');
      }

      console.log(`\n✅ PASS (${duration}ms)`);
      console.log(`Output: User successfully deleted`);

      this.results.push({
        name: testName,
        status: 'PASS',
        input,
        output: { success: true },
        duration,
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.log(`\n❌ FAIL (${duration}ms)`);
      console.log(`Error: ${errorMsg}`);

      this.results.push({
        name: testName,
        status: 'FAIL',
        input: this.testUserId,
        error: errorMsg,
        duration,
      });
    }
  }

  private printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      📊 TEST SUMMARY 📊                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    console.log('\n📈 Results:');
    console.log(`   Total Tests:    ${this.results.length}`);
    console.log(`   Passed:         ${passed} ✅`);
    console.log(`   Failed:         ${failed} ❌`);
    console.log(`   Total Duration: ${totalDuration}ms`);

    console.log('\n📋 Detailed Results:');
    this.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${index + 1}. ${icon} ${result.name} (${result.duration}ms)`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log('\n');
    if (failed === 0) {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║                   🎉 ALL TESTS PASSED! 🎉                      ║');
      console.log('║              All user service actions are working!             ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
    } else {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log(`║                ❌ ${failed} TESTS FAILED ❌                          ║`);
      console.log('║           Check the errors above for more details              ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
    }
    console.log('\n');
  }
}

// Run verification
const verification = new ActionVerification();
verification.run().catch(console.error);
