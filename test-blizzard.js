"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Test script for Blizzard API integration
var dotenv_1 = __importDefault(require("dotenv"));
var blizzard_js_1 = require("./server/services/blizzard.js");
dotenv_1.default.config();
// Class ID to Name mapping
var CLASS_MAP = {
    1: 'Warrior', 2: 'Paladin', 3: 'Hunter', 4: 'Rogue', 5: 'Priest',
    6: 'Death Knight', 7: 'Shaman', 8: 'Mage', 9: 'Warlock', 10: 'Monk',
    11: 'Druid', 12: 'Demon Hunter', 13: 'Evoker',
};
function testBlizzardAPI() {
    return __awaiter(this, void 0, void 0, function () {
        var token, rosterData, error_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🔍 Testing Blizzard API Integration...\n');
                    console.log('Configuration:');
                    console.log("  Region: ".concat(process.env.BLIZZARD_REGION));
                    console.log("  Realm: ".concat(process.env.WOW_REALM));
                    console.log("  Guild: ".concat(process.env.WOW_GUILD_NAME));
                    console.log("  Client ID: ".concat((_a = process.env.BLIZZARD_CLIENT_ID) === null || _a === void 0 ? void 0 : _a.substring(0, 8), "..."));
                    console.log('');
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    // Test 1: Get access token
                    console.log('📡 Step 1: Getting OAuth2 access token...');
                    return [4 /*yield*/, (0, blizzard_js_1.getBlizzardAccessToken)()];
                case 2:
                    token = _d.sent();
                    console.log('✅ Access token obtained successfully!\n');
                    // Test 2: Fetch guild roster
                    console.log('📡 Step 2: Fetching guild roster...');
                    return [4 /*yield*/, (0, blizzard_js_1.fetchGuildRoster)()];
                case 3:
                    rosterData = _d.sent();
                    console.log('✅ Guild roster fetched successfully!\n');
                    console.log('📊 Roster Summary:');
                    console.log("  Guild Name: ".concat(((_b = rosterData.guild) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown'));
                    console.log("  Total Members: ".concat(((_c = rosterData.members) === null || _c === void 0 ? void 0 : _c.length) || 0));
                    if (rosterData.members && rosterData.members.length > 0) {
                        console.log('\n👥 First 10 Members:');
                        rosterData.members.slice(0, 10).forEach(function (member, index) {
                            var _a;
                            var char = member.character;
                            var classId = (_a = char.playable_class) === null || _a === void 0 ? void 0 : _a.id;
                            var className = classId ? CLASS_MAP[classId] || 'Unknown' : 'Unknown';
                            console.log("  ".concat(index + 1, ". ").concat(char.name, " - ").concat(className, " (Level ").concat(char.level, ", Rank ").concat(member.rank, ")"));
                        });
                        if (rosterData.members.length > 10) {
                            console.log("  ... and ".concat(rosterData.members.length - 10, " more members"));
                        }
                    }
                    console.log('\n✨ SUCCESS! Blizzard API integration is working correctly.');
                    console.log('You can now use the "Sync from Blizzard" button in the app.\n');
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _d.sent();
                    console.error('\n❌ ERROR: Blizzard API test failed');
                    if (error_1.response) {
                        console.error("\nHTTP ".concat(error_1.response.status, ": ").concat(error_1.response.statusText));
                        console.error('Response:', JSON.stringify(error_1.response.data, null, 2));
                        if (error_1.response.status === 401) {
                            console.error('\n💡 This looks like an authentication error.');
                            console.error('Please verify your BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET are correct.');
                        }
                        else if (error_1.response.status === 404) {
                            console.error('\n💡 Guild not found.');
                            console.error('Please verify:');
                            console.error('  - Realm name is correct (case-sensitive)');
                            console.error('  - Guild name is correct (case-sensitive)');
                            console.error('  - Guild exists on the specified realm');
                        }
                    }
                    else if (error_1.message) {
                        console.error('\nError:', error_1.message);
                    }
                    else {
                        console.error('\nUnknown error:', error_1);
                    }
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
testBlizzardAPI();
