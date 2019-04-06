import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './AnswerSelect.css';
import retrieveAnswerQuery from '../../gql/retrieveAnswer.gql';
import { setAnswer, setAnswerUser } from '../../actions/units';

class AnswerSelect extends React.Component {
  state = { answers: [] };

  componentDidMount() {
    this.updateAnswers();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.answerUser.id !== prevProps.answerUser.id) {
      await this.updateAnswers();
    }
  }

  async updateAnswers() {
    const { course, unit, answerUser } = this.props;
    const resp = await this.context.fetch('/graphql', {
      body: JSON.stringify({
        query: retrieveAnswerQuery,
        variables: {
          userIds: [answerUser.id],
          unitIds: [unit.id],
          courseIds: [course.id],
        },
      }),
    });
    const { data } = await resp.json();
    const { answers = [] } = data.courses[0].units[0];
    this.setState({ answers });
    this.props.dispatch(setAnswer(answers[0] || {}));
  }

  handleUserSelect = id => {
    this.props.dispatch(
      setAnswerUser(this.props.course.users.find(u => u.id === id)),
    );
  };

  handleAnswerSelect = id => {
    this.props.dispatch(setAnswer(this.state.answers.find(a => a.id === id)));
  };

  render() {
    const {
      user,
      answerUser = { profile: {} },
      answer = {},
      course,
    } = this.props;
    const { answers } = this.state;
    const { users = [] } = course;
    return (
      <React.Fragment>
        {(user.role === 'teacher' || user.isAdmin) && (
          <DropdownButton
            id="user_chooser"
            title={answerUser.profile.displayName || 'User'}
            onSelect={this.handleUserSelect}
          >
            {users.map(u => (
              <MenuItem
                key={u.id}
                eventKey={u.id}
                active={u.id === answerUser.id}
                className={u.needMark && s['need-mark']}
              >
                {u.profile.displayName}
              </MenuItem>
            ))}
          </DropdownButton>
        )}
        <DropdownButton
          id="answer_chooser"
          title={(answer && answer.createdAt) || 'Answer'}
          onSelect={this.handleAnswerSelect}
        >
          {answers.map(ans => (
            <MenuItem
              key={ans.id}
              eventKey={ans.id}
              active={ans.id === answer.id}
              className={ans.needMark && s['need-mark']}
            >
              {ans.createdAt}
            </MenuItem>
          ))}
        </DropdownButton>
      </React.Fragment>
    );
  }
}

AnswerSelect.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
  answerUser: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  answer: PropTypes.shape({
    id: PropTypes.string,
    body: PropTypes.any,
  }).isRequired,
  course: PropTypes.shape({
    id: PropTypes.string,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
      }),
    ),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
};

AnswerSelect.contextTypes = {
  fetch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  unit: state.unit,
  answer: state.answer,
  answerUser: state.answerUser || state.course.users[0],
  course: state.course,
});

export default connect(mapStateToProps)(withStyles(s)(AnswerSelect));
