// Seed content for the question bank. Word problems are themed around
// Elena's interests: volleyball, Haikyuu!!, and My Hero Academia.
// Level: finished Saxon Course 2 (~grade 6-7 skills).

export interface SeedWordProblem {
  topic: string; // multi_step | fractions | percent | ratio | rate | average
  difficulty: number; // 1-5
  theme: string; // volleyball | haikyuu | mha | general
  prompt: string;
  answer: string;
  answerType: 'number' | 'fraction' | 'text';
  hints: string[];
  explanation: string;
}

export const wordProblems: SeedWordProblem[] = [
  {
    topic: 'multi_step', difficulty: 2, theme: 'haikyuu',
    prompt: 'Hinata practices spikes every day. On Monday he did 45 spikes, on Tuesday 60, and on Wednesday 75. If he keeps adding the same amount each day, how many spikes will he do on Saturday?',
    answer: '120', answerType: 'number',
    hints: [
      'How much does the number of spikes go up each day?',
      'It goes up 15 each day. Count the days from Wednesday to Saturday.',
      'Saturday is 3 days after Wednesday: 75 + 15 + 15 + 15.',
    ],
    explanation: 'The pattern adds 15 each day. Wednesday is 75, so Thursday 90, Friday 105, Saturday 120.',
  },
  {
    topic: 'multi_step', difficulty: 1, theme: 'haikyuu',
    prompt: 'Karasuno scored 25, 23, and 27 points in three sets. How many points did they score in total?',
    answer: '75', answerType: 'number',
    hints: ['Add the three set scores together.', '25 + 23 = 48. Now add the last set.', '48 + 27 = ?'],
    explanation: '25 + 23 + 27 = 75 points.',
  },
  {
    topic: 'ratio', difficulty: 3, theme: 'volleyball',
    prompt: 'The ratio of setters to spikers at training camp is 2:5. If there are 8 setters, how many spikers are there?',
    answer: '20', answerType: 'number',
    hints: [
      'The ratio 2:5 means for every 2 setters there are 5 spikers.',
      'How many groups of 2 setters make 8 setters?',
      'There are 4 groups, so there are 4 × 5 spikers.',
    ],
    explanation: '8 setters ÷ 2 = 4 groups. Each group has 5 spikers, so 4 × 5 = 20 spikers.',
  },
  {
    topic: 'percent', difficulty: 3, theme: 'haikyuu',
    prompt: 'Nekoma won 80% of their 35 matches this season. How many matches did they win?',
    answer: '28', answerType: 'number',
    hints: [
      '80% means 80 out of every 100, or 0.8.',
      'Find 80% of 35 by multiplying.',
      '0.8 × 35 = ?',
    ],
    explanation: '80% of 35 = 0.8 × 35 = 28 matches.',
  },
  {
    topic: 'percent', difficulty: 3, theme: 'volleyball',
    prompt: 'A volleyball costs $24. It is on sale for 25% off. What is the sale price in dollars?',
    answer: '18', answerType: 'number',
    hints: [
      'First find how many dollars the discount is.',
      '25% of 24 is one quarter of 24.',
      'The discount is $6. Subtract it from the original price.',
    ],
    explanation: '25% of $24 = $6 off. $24 − $6 = $18.',
  },
  {
    topic: 'rate', difficulty: 2, theme: 'haikyuu',
    prompt: 'Kageyama serves 12 balls every 3 minutes. At this rate, how many balls can he serve in 15 minutes?',
    answer: '60', answerType: 'number',
    hints: [
      'How many balls does he serve in 1 minute?',
      '12 ÷ 3 = 4 balls per minute.',
      'Multiply 4 balls per minute by 15 minutes.',
    ],
    explanation: '12 ÷ 3 = 4 balls per minute. 4 × 15 = 60 balls.',
  },
  {
    topic: 'average', difficulty: 3, theme: 'haikyuu',
    prompt: 'Hinata jumped 45 cm, 48 cm, 51 cm, and 52 cm in four attempts. What was his average jump height in cm?',
    answer: '49', answerType: 'number',
    hints: [
      'Average = total ÷ how many attempts.',
      'First add all four jumps.',
      'The total is 196. Divide by 4.',
    ],
    explanation: '45 + 48 + 51 + 52 = 196. 196 ÷ 4 = 49 cm.',
  },
  {
    topic: 'fractions', difficulty: 2, theme: 'volleyball',
    prompt: 'At practice, 2/3 of the 27 players stayed for extra serving drills. How many players stayed?',
    answer: '18', answerType: 'number',
    hints: [
      'To find 2/3 of a number, first find 1/3 of it.',
      '27 ÷ 3 = 9, so 1/3 of the players is 9.',
      'Now multiply 9 by 2.',
    ],
    explanation: '1/3 of 27 = 9. 2/3 = 2 × 9 = 18 players.',
  },
  {
    topic: 'fractions', difficulty: 2, theme: 'mha',
    prompt: 'Deku completed 3/4 of his 60 training exercises before lunch. How many exercises does he still need to do after lunch?',
    answer: '15', answerType: 'number',
    hints: [
      'First find how many exercises he already did.',
      '3/4 of 60 = 45 exercises done.',
      'Subtract 45 from 60 to find what is left.',
    ],
    explanation: '3/4 of 60 = 45 done. 60 − 45 = 15 exercises left.',
  },
  {
    topic: 'percent', difficulty: 2, theme: 'mha',
    prompt: 'All Might can lift 1,200 kg. Deku can currently lift 5% of that. How many kg can Deku lift?',
    answer: '60', answerType: 'number',
    hints: [
      '5% means 5 out of every 100.',
      '10% of 1,200 is 120. What is 5%?',
      'Half of 120 is your answer.',
    ],
    explanation: '10% of 1,200 = 120, so 5% = 60 kg.',
  },
  {
    topic: 'fractions', difficulty: 2, theme: 'mha',
    prompt: 'Class 1-A has 20 students. 2/5 of them have transformation-type quirks. How many students is that?',
    answer: '8', answerType: 'number',
    hints: [
      'Find 1/5 of 20 first.',
      '20 ÷ 5 = 4.',
      'Multiply 4 by 2.',
    ],
    explanation: '1/5 of 20 = 4. 2/5 = 8 students.',
  },
  {
    topic: 'rate', difficulty: 3, theme: 'mha',
    prompt: 'Bakugo\'s explosions launch him 36 meters in 4 seconds. How far can he travel in 10 seconds at the same speed?',
    answer: '90', answerType: 'number',
    hints: [
      'Find his speed in meters per second first.',
      '36 ÷ 4 = 9 meters per second.',
      'Multiply the speed by 10 seconds.',
    ],
    explanation: '36 ÷ 4 = 9 m/s. 9 × 10 = 90 meters.',
  },
  {
    topic: 'multi_step', difficulty: 4, theme: 'mha',
    prompt: 'The U.A. entrance exam had 1,540 applicants and only 36 passed. About how many applicants were there per passing student? Round to the nearest whole number.',
    answer: '43', answerType: 'number',
    hints: [
      'Divide the number of applicants by the number who passed.',
      '1,540 ÷ 36 is a little less than 43.',
      '1,540 ÷ 36 ≈ 42.8 — round it to the nearest whole number.',
    ],
    explanation: '1,540 ÷ 36 ≈ 42.8, which rounds to 43 applicants per passing student.',
  },
  {
    topic: 'multi_step', difficulty: 3, theme: 'haikyuu',
    prompt: 'Elena buys 3 volleyball keychains for $4.50 each and a Haikyuu!! poster for $12. She pays with a $30 bill. How much change does she get in dollars?',
    answer: '4.50', answerType: 'number',
    hints: [
      'First find the cost of the 3 keychains.',
      '3 × $4.50 = $13.50. Add the poster to get the total.',
      'Total is $25.50. Subtract from $30.',
    ],
    explanation: '3 × 4.50 = 13.50. 13.50 + 12 = 25.50. 30 − 25.50 = $4.50 change.',
  },
  {
    topic: 'multi_step', difficulty: 3, theme: 'volleyball',
    prompt: 'A tournament starts with 16 teams. Each round, half of the teams are eliminated. How many rounds does it take until only 1 team remains?',
    answer: '4', answerType: 'number',
    hints: [
      'After one round, how many teams are left?',
      '16 → 8 → 4 → ... keep halving.',
      'Count how many times you halve: 16 → 8 → 4 → 2 → 1.',
    ],
    explanation: '16 → 8 → 4 → 2 → 1 takes 4 rounds.',
  },
  {
    topic: 'multi_step', difficulty: 2, theme: 'mha',
    prompt: 'Uraraka floats 5 rocks with her quirk. Each rock weighs 2.4 kg. What is the total weight she is floating in kg?',
    answer: '12', answerType: 'number',
    hints: [
      'Multiply the weight of one rock by 5.',
      '2.4 × 5 — think of it as 24 × 5 then adjust the decimal.',
      '24 × 5 = 120, so 2.4 × 5 = 12.0.',
    ],
    explanation: '2.4 × 5 = 12 kg.',
  },
  {
    topic: 'fractions', difficulty: 4, theme: 'haikyuu',
    prompt: 'Hinata drinks 3/4 of a liter of water in the morning and 5/8 of a liter at practice. How many liters does he drink in total? Give your answer as a fraction or mixed number.',
    answer: '11/8', answerType: 'fraction',
    hints: [
      'To add fractions you need the same denominator.',
      '3/4 = 6/8. Now both fractions are in eighths.',
      '6/8 + 5/8 = 11/8, which is 1 3/8.',
    ],
    explanation: '3/4 = 6/8. 6/8 + 5/8 = 11/8 = 1 3/8 liters.',
  },
  {
    topic: 'fractions', difficulty: 4, theme: 'mha',
    prompt: 'Todoroki\'s ice covers 2/5 of the training field. His fire covers another 1/4 of the field. What fraction of the field is covered in total?',
    answer: '13/20', answerType: 'fraction',
    hints: [
      'Find a common denominator for 5 and 4.',
      'Use 20: convert 2/5 and 1/4 into twentieths.',
      '2/5 = 8/20 and 1/4 = 5/20. Add them.',
    ],
    explanation: '2/5 = 8/20, 1/4 = 5/20. 8/20 + 5/20 = 13/20 of the field.',
  },
  {
    topic: 'ratio', difficulty: 3, theme: 'haikyuu',
    prompt: 'For every 3 successful spikes, Hinata misses 2. If he attempted 40 spikes, how many were successful?',
    answer: '24', answerType: 'number',
    hints: [
      'Each "group" of attempts is 3 successes + 2 misses = 5 attempts.',
      'How many groups of 5 are in 40 attempts?',
      'There are 8 groups. Each group has 3 successes.',
    ],
    explanation: '40 ÷ 5 = 8 groups. 8 × 3 = 24 successful spikes.',
  },
  {
    topic: 'percent', difficulty: 4, theme: 'general',
    prompt: 'Last month Elena solved 40 math problems. This month she solved 50. By what percent did the number of problems increase?',
    answer: '25', answerType: 'number',
    hints: [
      'First find the increase: 50 − 40.',
      'The increase is 10. Compare it to the ORIGINAL number, 40.',
      '10 out of 40 = 10/40. Turn that into a percent.',
    ],
    explanation: 'Increase = 10. 10 ÷ 40 = 0.25 = 25% increase.',
  },
  {
    topic: 'rate', difficulty: 3, theme: 'volleyball',
    prompt: 'Volleyball practice starts at 3:40 PM and lasts 1 hour 35 minutes. What time does it end? (Write like 5:15 PM)',
    answer: '5:15 PM', answerType: 'text',
    hints: [
      'Add the hour first: 3:40 + 1 hour = 4:40.',
      'Now add 35 minutes to 4:40.',
      '4:40 + 20 minutes = 5:00, then 15 more minutes.',
    ],
    explanation: '3:40 + 1:00 = 4:40. 4:40 + 35 min = 5:15 PM.',
  },
  {
    topic: 'multi_step', difficulty: 4, theme: 'mha',
    prompt: 'Kirishima hardens for 90 seconds, then rests for 30 seconds, repeating this cycle. How many complete cycles can he do in 10 minutes?',
    answer: '5', answerType: 'number',
    hints: [
      'How long is one full cycle (harden + rest)?',
      'One cycle = 120 seconds. How many seconds are in 10 minutes?',
      '600 seconds ÷ 120 seconds per cycle = ?',
    ],
    explanation: 'One cycle = 90 + 30 = 120 s. 10 min = 600 s. 600 ÷ 120 = 5 cycles.',
  },
  {
    topic: 'average', difficulty: 5, theme: 'general',
    prompt: 'Elena\'s last four quiz scores were 88, 92, 79, and 95. What score does she need on the fifth quiz to have an average of exactly 90?',
    answer: '96', answerType: 'number',
    hints: [
      'If the average of 5 quizzes is 90, what must the TOTAL of all 5 be?',
      'The total must be 5 × 90 = 450.',
      'Add the four scores you have (354) and subtract from 450.',
    ],
    explanation: '5 × 90 = 450 needed in total. 88 + 92 + 79 + 95 = 354. 450 − 354 = 96.',
  },
  {
    topic: 'multi_step', difficulty: 3, theme: 'haikyuu',
    prompt: 'A volleyball net is 2.24 m high. Hinata\'s standing reach is 2.10 m. How many more centimeters does he need to jump to reach the top of the net?',
    answer: '14', answerType: 'number',
    hints: [
      'Find the difference in meters first.',
      '2.24 − 2.10 = 0.14 meters.',
      'Convert 0.14 m to centimeters (1 m = 100 cm).',
    ],
    explanation: '2.24 − 2.10 = 0.14 m = 14 cm.',
  },
  {
    topic: 'multi_step', difficulty: 2, theme: 'mha',
    prompt: 'Tickets to the hero exhibition cost $8 for kids and $14 for adults. Elena\'s family buys 3 kid tickets and 2 adult tickets. How much do they spend in total in dollars?',
    answer: '52', answerType: 'number',
    hints: [
      'Find the cost of the kid tickets and adult tickets separately.',
      'Kids: 3 × $8 = $24. Adults: 2 × $14 = ?',
      'Add $24 and $28.',
    ],
    explanation: '3 × 8 = 24. 2 × 14 = 28. 24 + 28 = $52.',
  },
  {
    topic: 'rate', difficulty: 3, theme: 'mha',
    prompt: 'Momo creates 15 marbles every 20 seconds with her quirk. How many marbles can she create in 2 minutes?',
    answer: '90', answerType: 'number',
    hints: [
      'How many seconds are in 2 minutes?',
      '120 seconds. How many 20-second chunks is that?',
      '6 chunks × 15 marbles each = ?',
    ],
    explanation: '2 min = 120 s = six 20-second chunks. 6 × 15 = 90 marbles.',
  },

  // ---- Saxon Course 3 (pre-algebra) additions ----
  {
    topic: 'geometry', difficulty: 3, theme: 'volleyball',
    prompt: 'A volleyball court is a rectangle 18 m long and 9 m wide. What is its area in square meters?',
    answer: '162', answerType: 'number',
    hints: ['Area of a rectangle = length × width.', 'Multiply 18 by 9.', '18 × 9 = 18 × 10 − 18.'],
    explanation: 'Area = 18 × 9 = 162 m².',
  },
  {
    topic: 'geometry', difficulty: 3, theme: 'haikyuu',
    prompt: 'A rectangular Karasuno banner is 250 cm long and 80 cm wide. How many cm of ribbon are needed to go all the way around it?',
    answer: '660', answerType: 'number',
    hints: ['Going all the way around = perimeter.', 'Perimeter = 2 × (length + width).', '2 × (250 + 80) = ?'],
    explanation: 'Perimeter = 2 × (250 + 80) = 2 × 330 = 660 cm.',
  },
  {
    topic: 'geometry', difficulty: 5, theme: 'volleyball',
    prompt: 'Coach paints a circle for a serving target with a radius of 3 m. Using π ≈ 3.14, what is the area of the circle in m²?',
    answer: '28.26', answerType: 'number',
    hints: ['Area of a circle = π × radius².', 'First find 3² = 9.', 'Multiply 3.14 × 9.'],
    explanation: 'Area = 3.14 × 3² = 3.14 × 9 = 28.26 m².',
  },
  {
    topic: 'ratio', difficulty: 4, theme: 'mha',
    prompt: 'A poster of All Might is drawn at a scale of 1:20. If All Might is 220 cm tall, how tall is he in the poster, in cm?',
    answer: '11', answerType: 'number',
    hints: ['A scale of 1:20 means the real thing is 20 times bigger.', 'Divide the real height by 20.', '220 ÷ 20 = ?'],
    explanation: 'Poster height = 220 ÷ 20 = 11 cm.',
  },
  {
    topic: 'equations', difficulty: 4, theme: 'general',
    prompt: 'Elena is thinking of a number. If you multiply it by 4 and then add 7, you get 43. What is her number?',
    answer: '9', answerType: 'number',
    hints: ['Work backwards from 43.', 'Undo the "+7" first: 43 − 7 = 36.', 'Now undo the "× 4".'],
    explanation: '43 − 7 = 36, then 36 ÷ 4 = 9. (As an equation: 4x + 7 = 43.)',
  },
  {
    topic: 'equations', difficulty: 5, theme: 'haikyuu',
    prompt: 'Kageyama had a box of volleyballs. He gave away 8, then split the rest equally into 3 bags with 12 balls in each bag. How many volleyballs did he start with?',
    answer: '44', answerType: 'number',
    hints: ['Work backwards from the end.', '3 bags of 12 = 36 balls after giving some away.', 'Before giving away 8, he had 36 + 8.'],
    explanation: '3 × 12 = 36 left after giving away 8, so he started with 36 + 8 = 44.',
  },
  {
    topic: 'rate', difficulty: 4, theme: 'general',
    prompt: '6 identical water bottles cost $21. How much would 10 of the same bottles cost, in dollars?',
    answer: '35', answerType: 'number',
    hints: ['First find the price of ONE bottle.', '$21 ÷ 6 = $3.50 each.', 'Multiply $3.50 by 10.'],
    explanation: '21 ÷ 6 = 3.50 per bottle. 3.50 × 10 = $35.',
  },
  {
    topic: 'percent', difficulty: 5, theme: 'mha',
    prompt: "Deku's power output grew from 40 units to 46 units after training. What was the percent increase?",
    answer: '15', answerType: 'number',
    hints: ['First find the increase: 46 − 40.', 'Compare the increase of 6 to the ORIGINAL 40.', '6/40 as a percent = ?'],
    explanation: 'Increase = 6. 6 ÷ 40 = 0.15 = 15%.',
  },
  {
    topic: 'multi_step', difficulty: 3, theme: 'haikyuu',
    prompt: 'At the mountain training camp, the temperature was −4°C at dawn and rose 11 degrees by noon. What was the temperature at noon in °C?',
    answer: '7', answerType: 'number',
    hints: ['Start at −4 on a number line.', 'Move up (right) 11 steps.', '−4 + 11 = ?'],
    explanation: '−4 + 11 = 7°C.',
  },
  {
    topic: 'multi_step', difficulty: 4, theme: 'general',
    prompt: 'One bacteria cell doubles every hour. Starting with 1 cell, how many cells will there be after 6 hours?',
    answer: '64', answerType: 'number',
    hints: ['After 1 hour: 2. After 2 hours: 4. Keep doubling.', 'That is 2 multiplied by itself 6 times.', '2⁶ = ?'],
    explanation: 'Doubling 6 times: 2⁶ = 64 cells.',
  },

  // ---- Bungo Stray Dogs themed ----
  {
    topic: 'multi_step', difficulty: 2, theme: 'bsd',
    prompt: 'The Armed Detective Agency solved 8 cases in June and 13 cases in July. Each solved case earns a $25 reward. How much reward money did they earn in total?',
    answer: '525', answerType: 'number',
    hints: ['First find the total number of cases.', '8 + 13 = 21 cases.', 'Multiply 21 cases by $25 each.'],
    explanation: '8 + 13 = 21 cases. 21 × 25 = $525.',
  },
  {
    topic: 'fractions', difficulty: 3, theme: 'bsd',
    prompt: 'Kyoka bought 24 rice crackers. She gave 3/8 of them to Atsushi. How many crackers does she have left?',
    answer: '15', answerType: 'number',
    hints: ['First find how many crackers 3/8 of 24 is.', '24 ÷ 8 = 3, so 1/8 is 3 crackers and 3/8 is 9.', 'Subtract the 9 she gave away from 24.'],
    explanation: '3/8 of 24 = 9 crackers given away. 24 − 9 = 15 left.',
  },
  {
    topic: 'percent', difficulty: 4, theme: 'bsd',
    prompt: "A detective coat like Dazai's costs $80. It is on sale for 35% off. What is the sale price in dollars?",
    answer: '52', answerType: 'number',
    hints: ['First find the discount amount.', '35% of 80 = 0.35 × 80.', 'The discount is $28. Subtract it from $80.'],
    explanation: '35% of $80 = $28 off. 80 − 28 = $52.',
  },
  {
    topic: 'rate', difficulty: 3, theme: 'bsd',
    prompt: 'Kunikida writes 4 pages of plans in his notebook every 10 minutes. At this rate, how many pages does he write in one hour?',
    answer: '24', answerType: 'number',
    hints: ['How many 10-minute chunks are in one hour?', 'There are 6 chunks of 10 minutes.', '6 chunks × 4 pages each = ?'],
    explanation: '60 ÷ 10 = 6 chunks. 6 × 4 = 24 pages.',
  },
  {
    topic: 'equations', difficulty: 4, theme: 'bsd',
    prompt: 'Ranpo left a puzzle: "Multiply the secret room number by 3, subtract 7, and you get 29." What is the room number?',
    answer: '12', answerType: 'number',
    hints: ['Work backwards from 29.', 'Undo the "−7" first: 29 + 7 = 36.', 'Now undo the "× 3".'],
    explanation: '29 + 7 = 36, then 36 ÷ 3 = 12. (As an equation: 3x − 7 = 29.)',
  },
  {
    topic: 'average', difficulty: 4, theme: 'bsd',
    prompt: 'Over four weeks, the Agency solved 12, 9, 15, and 8 cases. What was the average number of cases per week?',
    answer: '11', answerType: 'number',
    hints: ['Average = total ÷ number of weeks.', 'Add the four numbers first.', 'The total is 44. Divide by 4.'],
    explanation: '12 + 9 + 15 + 8 = 44. 44 ÷ 4 = 11 cases per week.',
  },
  {
    topic: 'geometry', difficulty: 3, theme: 'bsd',
    prompt: "The Agency's office floor is a rectangle 9 m long and 6 m wide. They want new carpet for the whole floor. How many square meters of carpet do they need?",
    answer: '54', answerType: 'number',
    hints: ['Carpet covers the area of the floor.', 'Area of a rectangle = length × width.', '9 × 6 = ?'],
    explanation: 'Area = 9 × 6 = 54 m².',
  },
  {
    topic: 'ratio', difficulty: 3, theme: 'bsd',
    prompt: 'For every 3 clues Atsushi finds, Dazai finds 5. If Atsushi found 12 clues on a case, how many did Dazai find?',
    answer: '20', answerType: 'number',
    hints: ['The ratio is 3:5.', 'How many groups of 3 clues make 12?', '4 groups — so Dazai found 4 × 5 clues.'],
    explanation: '12 ÷ 3 = 4 groups. 4 × 5 = 20 clues.',
  },

  // ---- Stray Kids themed ----
  {
    topic: 'multi_step', difficulty: 3, theme: 'skz',
    prompt: 'Stray Kids has 8 members. For a fan meeting, each member signs 45 photocards, and the staff adds 120 extra pre-signed cards. How many signed cards are there in total?',
    answer: '480', answerType: 'number',
    hints: ['First find how many cards the members sign.', '8 × 45 = 360 cards.', 'Now add the 120 extra cards.'],
    explanation: '8 × 45 = 360. 360 + 120 = 480 cards.',
  },
  {
    topic: 'percent', difficulty: 3, theme: 'skz',
    prompt: 'A Stray Kids album costs $20. With a 15% fan-club discount, what is the price in dollars?',
    answer: '17', answerType: 'number',
    hints: ['First find the discount in dollars.', '15% of 20 = 0.15 × 20 = 3.', 'Subtract $3 from $20.'],
    explanation: '15% of $20 = $3 off. 20 − 3 = $17.',
  },
  {
    topic: 'rate', difficulty: 3, theme: 'skz',
    prompt: 'Felix bakes 12 brownies every 40 minutes. How many brownies can he bake in 2 hours?',
    answer: '36', answerType: 'number',
    hints: ['How many minutes are in 2 hours?', '120 minutes. How many 40-minute rounds is that?', '3 rounds × 12 brownies each = ?'],
    explanation: '2 h = 120 min = three 40-minute rounds. 3 × 12 = 36 brownies.',
  },
  {
    topic: 'fractions', difficulty: 4, theme: 'skz',
    prompt: 'Hyunjin practiced a dance for 3/4 of an hour in the morning and 5/6 of an hour in the evening. How many hours did he practice in total? Give your answer as a fraction or mixed number.',
    answer: '19/12', answerType: 'fraction',
    hints: ['Find a common denominator for 4 and 6.', 'Use 12: convert both fractions into twelfths.', '3/4 = 9/12 and 5/6 = 10/12. Add them.'],
    explanation: '3/4 = 9/12, 5/6 = 10/12. 9/12 + 10/12 = 19/12 = 1 7/12 hours.',
  },
  {
    topic: 'average', difficulty: 5, theme: 'skz',
    prompt: "In four dance practice runs, Han's scores were 82, 88, 91, and 85. What score does he need on the fifth run for an average of exactly 88?",
    answer: '94', answerType: 'number',
    hints: ['If the average of 5 runs is 88, what must the TOTAL be?', 'The total must be 5 × 88 = 440.', 'Add the four scores (346) and subtract from 440.'],
    explanation: '5 × 88 = 440 needed. 82 + 88 + 91 + 85 = 346. 440 − 346 = 94.',
  },
  {
    topic: 'multi_step', difficulty: 2, theme: 'skz',
    prompt: 'A concert lightstick costs $35. Elena saves $6 each week. After 5 weeks of saving, how many more dollars does she still need?',
    answer: '5', answerType: 'number',
    hints: ['First find how much she saves in 5 weeks.', '5 × 6 = 30 dollars saved.', 'Subtract her savings from the price.'],
    explanation: '5 × 6 = $30 saved. 35 − 30 = $5 more needed.',
  },
  {
    topic: 'ratio', difficulty: 4, theme: 'skz',
    prompt: 'In one song, the fan chant follows a pattern: for every 4 lines the members sing, the fans chant 3 lines. If the members sing 28 lines, how many lines do the fans chant?',
    answer: '21', answerType: 'number',
    hints: ['The ratio of sung lines to chant lines is 4:3.', 'How many groups of 4 sung lines are in 28?', '7 groups × 3 chant lines each = ?'],
    explanation: '28 ÷ 4 = 7 groups. 7 × 3 = 21 chant lines.',
  },
  {
    topic: 'equations', difficulty: 5, theme: 'skz',
    prompt: 'Elena gave away 14 photocards, then split the rest equally into 4 albums with 9 cards in each album. How many photocards did she start with?',
    answer: '50', answerType: 'number',
    hints: ['Work backwards from the end.', '4 albums × 9 cards = 36 cards after giving some away.', 'Before giving away 14, she had 36 + 14.'],
    explanation: '4 × 9 = 36 left after giving away 14, so she started with 36 + 14 = 50.',
  },
];

export const rewards = [
  { name: 'Extra 30 min screen time', emoji: '📱', cost: 50 },
  { name: 'Ice cream trip', emoji: '🍦', cost: 80 },
  { name: 'Volleyball practice with Dad', emoji: '🏐', cost: 120 },
  { name: 'New manga volume', emoji: '📚', cost: 200 },
  { name: 'Movie night (you pick!)', emoji: '🎬', cost: 150 },
];

export interface SeedLevel {
  ord: number;
  name: string;
  emoji: string;
  kind: 'arithmetic' | 'word' | 'mixed';
  topic: string; // arithmetic topic, 'mixed', or word-problem pool
  difficulty: number;
  questionCount: number;
  passCorrect: number;
  bonus: number;
}

export const challengeLevels: SeedLevel[] = [
  { ord: 1, name: 'Rookie Rally', emoji: '🏐', kind: 'arithmetic', topic: 'add_sub', difficulty: 1, questionCount: 6, passCorrect: 5, bonus: 10 },
  { ord: 2, name: 'Quick Sets', emoji: '⚡', kind: 'arithmetic', topic: 'mult', difficulty: 2, questionCount: 6, passCorrect: 5, bonus: 12 },
  { ord: 3, name: 'Serve & Solve', emoji: '🎯', kind: 'arithmetic', topic: 'mixed', difficulty: 2, questionCount: 8, passCorrect: 6, bonus: 15 },
  { ord: 4, name: 'Fraction Frenzy', emoji: '🍕', kind: 'arithmetic', topic: 'fractions', difficulty: 2, questionCount: 6, passCorrect: 5, bonus: 15 },
  { ord: 5, name: 'Story Time', emoji: '📖', kind: 'word', topic: 'mixed', difficulty: 2, questionCount: 4, passCorrect: 3, bonus: 20 },
  { ord: 6, name: 'Decimal Dash', emoji: '🏃‍♀️', kind: 'arithmetic', topic: 'decimals', difficulty: 3, questionCount: 6, passCorrect: 5, bonus: 18 },
  { ord: 7, name: 'Percent Power', emoji: '💪', kind: 'arithmetic', topic: 'percent', difficulty: 3, questionCount: 6, passCorrect: 5, bonus: 20 },
  { ord: 8, name: 'Boss Battle: Nationals', emoji: '👑', kind: 'mixed', topic: 'mixed', difficulty: 4, questionCount: 8, passCorrect: 6, bonus: 30 },
  // Saxon Course 3
  { ord: 9, name: 'Power Play', emoji: '🧨', kind: 'arithmetic', topic: 'exponents_roots', difficulty: 3, questionCount: 6, passCorrect: 5, bonus: 20 },
  { ord: 10, name: 'X Marks the Spot', emoji: '🧩', kind: 'arithmetic', topic: 'equations', difficulty: 3, questionCount: 6, passCorrect: 5, bonus: 22 },
  { ord: 11, name: 'Court Geometry', emoji: '📐', kind: 'arithmetic', topic: 'geometry', difficulty: 3, questionCount: 6, passCorrect: 5, bonus: 22 },
  { ord: 12, name: 'Boss Battle: Saxon 3 Showdown', emoji: '🐉', kind: 'mixed', topic: 'mixed', difficulty: 4, questionCount: 8, passCorrect: 6, bonus: 35 },
];
