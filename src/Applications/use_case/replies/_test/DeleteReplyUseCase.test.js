const ThreadRepository = require('../../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../../Domains/comments/CommentRepository');
const RepliesRepository = require('../../../../Domains/replies/RepliesRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');

describe('DeleteReplyUseCase', () => {
    it('should orchestracting the delete reply action correctly', async () => {
        // Arrange
        const mockRepliesRepository = new RepliesRepository();
        const mockCommentRepository = new CommentRepository();
        const mockThreadRepository = new ThreadRepository();

        mockRepliesRepository.deleteReply = jest.fn()
            .mockImplementation(() => Promise.resolve());
        mockCommentRepository.verifyCommentLocation = jest.fn()
            .mockImplementation(() => Promise.resolve());
        mockThreadRepository.verifyThread = jest.fn()
            .mockImplementation(() => Promise.resolve());

        const usecase = new DeleteReplyUseCase({
            repliesRepository: mockRepliesRepository,
            commentRepository: mockCommentRepository,
            threadRepository: mockThreadRepository,
        });

        // Action
        await usecase.execute('thread-123', 'comment-123', 'reply-123', 'user-123');

        // Assert
        expect(mockThreadRepository.verifyThread).toBeCalledWith('thread-123');
        expect(mockCommentRepository.verifyCommentLocation).toBeCalledWith('comment-123', 'thread-123');
        expect(mockRepliesRepository.deleteReply).toBeCalledWith('reply-123', 'user-123');
    });
});
