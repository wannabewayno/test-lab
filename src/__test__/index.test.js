describe('Suite 1', () => {
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('Oh no!', done => { done(new Error('FAIL!')); });
    it('Wait whaaaaat?', done => { done(new Error('FAIL!')); });
    it('Should pass', done => { done(); });
    it('Why you not work?', done => { done(new Error('FAIL!')); });
    it('Bruh.... why you do this?', done => { done(new Error('FAIL!')); });
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('Should fail', done => { done(new Error('FAIL!')); });
    it('FAAAAAIL', done => { done(new Error('FAIL!')); });
})

describe('Suite 2:', () => {
    describe('Nested describe:', () => {
        it('Should pass', done => { done(); });
        it('Nested Fail', done => { done(new Error('FAIL!')); });
        it('Should pass', done => { done(); });

        describe('Nested describe:', () => {
            it('Should pass', done => { done(); });
            it('Super nested fail', done => { done(new Error('FAIL!')); });
            it('Should pass', done => { done(); });

            describe('Nested describe:', () => {
                it('Should pass', done => { done(); });
                it('Deeply nested fail', done => { done(new Error('FAIL!')); });
                it('Should pass', done => { done(); });
            });
        });
    });
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('This shoudln\'t fail, BUT IT DID', done => { done(new Error('FAIL!')); });
    it('This is not ok', done => { done(new Error('FAIL!')); });
    it('You... you did this', done => { done(new Error('FAIL!')); });
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('Should pass', done => { done(); });
    it('You shall not pass', done => { done(new Error('FAIL!')); });
    it('It\'s always the last one that fails too', done => { done(new Error('FAIL!')); });
})