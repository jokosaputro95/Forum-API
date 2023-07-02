/* eslint-disable no-unused-vars */
class DeleteReplyUseCase {
    constructor({ repliesRepository, commentRepository, threadRepository }) {
        this._repliesRepository = repliesRepository;
        this._commentRepository = commentRepository;
        this._threadRepository = threadRepository;
    }

    async execute(threadId, commentId, replyId, userId) {
        await this._threadRepository.verifyThread(threadId);

        await this._commentRepository.verifyCommentLocation(commentId, threadId);

        return this._repliesRepository.deleteReply(replyId, userId);
    }
}

module.exports = DeleteReplyUseCase;
