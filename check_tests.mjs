import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('../ai-test-platform/.env.local', 'utf-8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTests() {
    const { data: tests, error } = await supabase
        .from('tests')
        .select('id, title, questions')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching tests:", error);
        return;
    }

    for (const test of tests) {
        console.log(`\nTest: ${test.title} (ID: ${test.id})`);
        if (test.questions && test.questions.length > 0) {
            const q1 = test.questions[0];
            console.log("Q1 TEXT LENGTH:", q1.question.length);
            console.log("Q1 First 100 chars:", q1.question.substring(0, 100));
            const validOpts = q1.options.filter(o => o.text && String(o.text).trim() !== "");
            console.log("Q1 Valid Options count:", validOpts.length);
            validOpts.forEach(o => {
                console.log(`  Option length: ${o.text?.length || 0}`);
            });
            console.log("Q1 Correct Answer given:", `"${q1.correctAnswer}"`);
            const correctAns = String(q1.correctAnswer || '').trim().toUpperCase();
            const correctIdx = validOpts.findIndex((o) => String(o.label || '').trim().toUpperCase() === correctAns);
            console.log("Q1 Match Index:", correctIdx);
        } else {
            console.log("No questions found.");
        }
    }
}

checkTests();
